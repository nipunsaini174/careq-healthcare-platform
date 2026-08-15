import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { safeEmit } from '../sockets/emit.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_change_me';

// Matches the error messages Supabase returns when an email is already
// present in `auth.users`. Kept as a regex because the exact wording has
// changed between gotrue versions ("already been registered", "already
// registered", "User already registered", etc.).
const SUPABASE_EMAIL_TAKEN_REGEX = /already.*(registered|exists|been registered)/i;

// Look up a Supabase Auth user by email. The admin API does not expose a
// direct lookup-by-email endpoint, so we paginate `listUsers` until we
// find a match or exhaust the pages.
async function findSupabaseAuthUserByEmail(email: string): Promise<{ id: string } | null> {
  const PER_PAGE = 1000;
  const target = email.toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw error;
    const match = data.users.find((u) => (u.email ?? '').toLowerCase() === target);
    if (match) return { id: match.id };
    if (data.users.length < PER_PAGE) return null;
  }
  return null;
}

export class AuthService {
  async signUp(email: string, password: string, fullName: string, role: string, hospitalId: number, extraData?: any) {
    if (!email || !password || !fullName || !role) {
      throw new Error('Email, password, fullName, and role are required');
    }

    // Check if user already exists in our application DB.
    const existingUser = await prisma.users.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Single place that talks to Supabase Auth, so we can wrap it with
    // orphan-healing retry logic below.
    const createSupabaseAuthUser = async () => {
      if (email === 'dhruvraj4872@gmail.com') {
        // Hits Resend to send a confirmation email.
        const res = await supabase.auth.signUp({ email, password });
        return { error: res.error };
      }
      console.log(`[DEV MODE] Bypassing Resend verification email for ${email}`);
      const res = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      return { error: res.error };
    };

    let { error: authError } = await createSupabaseAuthUser();

    // Orphan-heal: Supabase Auth still has this email but our public.users
    // table doesn't (verified above). This happens when someone deletes a
    // row from public.users via the Table Editor — the auth.users row in
    // Supabase's auth schema is not touched. We treat that auth row as
    // dead, delete it, and retry the create with the new password.
    if (authError && SUPABASE_EMAIL_TAKEN_REGEX.test(authError.message)) {
      const orphan = await findSupabaseAuthUserByEmail(email);
      if (orphan) {
        const del = await supabaseAdmin.auth.admin.deleteUser(orphan.id);
        if (del.error) {
          console.error(`[signUp] Failed to remove orphan Supabase Auth user for ${email}:`, del.error);
          throw new Error(del.error.message);
        }
        console.log(`[signUp] Removed orphan Supabase Auth user for ${email} (id=${orphan.id}); retrying signup`);
        ({ error: authError } = await createSupabaseAuthUser());
      }
    }

    if (authError) {
      throw new Error(authError.message);
    }

    // Create user in DB
    const user = await prisma.users.create({
      data: {
        email,
        password_hash: 'SUPABASE_AUTH_DELEGATED',
        full_name: fullName,
        role: role,
        hospital_id: hospitalId ? Number(hospitalId) : 1,
        status: 'active',
      },
    });

    if (role === 'patient') {
      // Also create a linked patient record
      const newPat = await prisma.patients.create({
        data: {
          hospital_id: user.hospital_id,
          // primary_doctor_id stays null on signup — a primary doctor is
          // assigned later (e.g. after a first appointment), not at
          // registration time. Hard-coding a placeholder () was breaking
          // signup whenever doctor #1 didn't exist.
          uhid: `UHID-${Date.now().toString().slice(-6)}`,
          full_name: fullName,
          age: 0,
          gender: extraData?.gender || 'Not Specified',
          phone: extraData?.phone || null,
          dob: extraData?.dob || null,
          abha_id: extraData?.abhaId || null,
          blood_group: 'Unknown',
          billing_status: 'Unpaid',
          patient_status: 'Active',
          user_id: user.user_id,
          email: user.email,
        }
      });

      safeEmit('patient_created', {
        id: newPat.uhid,
        name: newPat.full_name,
        age: newPat.age.toString(),
        gender: newPat.gender,
        blood: newPat.blood_group,
        dept: 'General',
        doctor: 'Not Assigned',
        status: newPat.patient_status,
        condition: 'Stable',
        phone: newPat.phone || 'N/A',
        email: newPat.email || 'N/A',
        address: 'Not Provided',
        admitted: new Date().toISOString(),
      });
    }

    // Always generate a JWT from the DB user (admin.createUser never returns a session)
    const token = jwt.sign(
      { userId: Number(user.user_id), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Don't send password hash back
    const { password_hash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async signIn(email: string, password: string) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Validate password via Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    let user = await prisma.users.findFirst({
      where: { email },
    });

    // Auto-heal: an account exists in Supabase Auth (we just verified the
    // password) but not in our local `users` table. This can happen if a
    // user was created directly in Supabase, a previous signup partially
    // failed, or the public.users row was deleted manually. Since
    // Supabase is the source of truth for credentials, treat the login
    // as valid and recreate the missing local rows.
    if (!user) {
      const supabaseUser = authData?.user;
      const metadataName = (supabaseUser?.user_metadata as any)?.full_name as string | undefined;
      const fallbackName = email.split('@')[0] || 'Patient';
      const fullName = metadataName?.trim() || fallbackName;

      // Pick a sensible hospital_id — first one in DB, or fall back to .
      const firstHospital = await prisma.hospitals.findFirst();
      const hospitalId = firstHospital?.hospital_id ?? 1;

      user = await prisma.users.create({
        data: {
          email,
          password_hash: 'SUPABASE_AUTH_DELEGATED',
          full_name: fullName,
          role: 'patient',
          hospital_id: hospitalId,
          status: 'active',
        },
      });

      // The patient app needs a patients row to function. Create one if
      // we just created the user (matches signUp behaviour). primary_doctor_id
      // stays null — it gets set later when the patient has an actual doctor.
      await prisma.patients.create({
        data: {
          hospital_id: user.hospital_id,
          uhid: `UHID-${Date.now().toString().slice(-6)}`,
          full_name: fullName,
          age: 0,
          gender: 'Not Specified',
          blood_group: 'Unknown',
          billing_status: 'Unpaid',
          patient_status: 'Active',
          user_id: user.user_id,
          email: user.email,
        },
      });
    }

    // Update last login
    await prisma.users.update({
      where: { user_id: user.user_id },
      data: { last_login: new Date() },
    });

    const token = jwt.sign(
      { userId: Number(user.user_id), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const { password_hash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async updateProfile(userId: number, fullName: string) {
    if (!fullName) {
      throw new Error('Full name is required');
    }
    const updated = await prisma.users.update({
      where: { user_id: Number(userId) },
      data: { full_name: fullName },
    });
    return {
      user_id: String(updated.user_id),
      email: updated.email,
      full_name: updated.full_name,
      role: updated.role,
    };
  }

  async signOut() {
    return { success: true };
  }
}

export const authService = new AuthService();
