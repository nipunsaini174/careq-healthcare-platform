import { prisma } from '../prisma/client.js';
import { supabaseAdmin } from '../config/supabase.js';

export class ReceptionistService {
  async getAllReceptionists(hospitalId: bigint) {
    const receptionists = await prisma.receptionists.findMany({
      where: { hospital_id: hospitalId },
      include: {
        users: true,
      },
    });

    return receptionists.map(rec => ({
      id: String(rec.receptionist_id),
      name: rec.users.full_name,
      email: rec.users.email,
      phone: rec.users.phone || "",
      status: rec.status,
      shift_start: rec.shift_start,
      shift_end: rec.shift_end,
    }));
  }

  /** Profile payload for the logged-in receptionist's settings page. */
  formatReceptionistProfile(rec: {
    receptionist_id: bigint;
    status: string;
    shift_start: Date;
    shift_end: Date;
    users: { user_id: bigint; full_name: string; email: string; phone: string | null; role: string };
    hospitals: { hospital_name: string; branch_name: string };
  }) {
    return {
      id: String(rec.receptionist_id),
      userId: String(rec.users.user_id),
      name: rec.users.full_name,
      email: rec.users.email,
      phone: rec.users.phone || "",
      role: rec.users.role,
      status: rec.status,
      shift_start: rec.shift_start,
      shift_end: rec.shift_end,
      hospitalName: rec.hospitals.hospital_name,
      branchName: rec.hospitals.branch_name,
    };
  }

  async getProfileByUserId(userId: bigint) {
    const rec = await prisma.receptionists.findFirst({
      where: { user_id: userId },
      include: {
        users: true,
        hospitals: true,
      },
    });
    if (rec) return this.formatReceptionistProfile(rec);

    // Fallback: user exists with RECEPTIONIST role but no receptionists row
    // (e.g. legacy data). Still return their assigned name/email/phone.
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: { hospitals: true },
    });
    if (!user || !/receptionist/i.test(user.role)) {
      throw new Error('Receptionist profile not found');
    }

    return {
      id: '',
      userId: String(user.user_id),
      name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      shift_start: new Date('1970-01-01T09:00:00Z'),
      shift_end: new Date('1970-01-01T17:00:00Z'),
      hospitalName: user.hospitals?.hospital_name ?? '',
      branchName: user.hospitals?.branch_name ?? '',
    };
  }

  async updateProfileByUserId(userId: bigint, data: { name?: string; phone?: string }) {
    const rec = await prisma.receptionists.findFirst({
      where: { user_id: userId },
      include: { users: true, hospitals: true },
    });
    if (!rec) throw new Error('Receptionist profile not found');

    const updatedUser = await prisma.users.update({
      where: { user_id: userId },
      data: {
        ...(data.name !== undefined ? { full_name: data.name.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone.trim() || null } : {}),
      },
    });

    return this.formatReceptionistProfile({
      ...rec,
      users: { ...rec.users, ...updatedUser },
    });
  }

  async createReceptionist(hospitalId: bigint, data: any) {
    const { name, email, phone, shift_start, shift_end, status, password } = data;

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Ensure the hospital exists
    const hospital = await prisma.hospitals.findUnique({
      where: { hospital_id: hospitalId }
    });
    
    if (!hospital) {
      throw new Error('Hospital not found');
    }

    // Use Supabase Admin to create the user directly to bypass email sending limits
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || '123456789', // Default password, they can reset it later
      email_confirm: true,
      user_metadata: {
        role: 'RECEPTIONIST'
      }
    });

    if (authError) {
      throw new Error(`Supabase create failed: ${authError.message || JSON.stringify(authError)}`);
    }

    // Use a transaction to create User and Receptionist together
    const newReceptionist = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          hospital_id: hospital.hospital_id,
          full_name: name,
          email: email,
          phone: phone || null,
          password_hash: "SUPABASE_AUTH_DELEGATED",
          role: "RECEPTIONIST",
          status: "active"
        }
      });

      // Provide default shift times if none provided
      const defaultShiftStart = new Date('1970-01-01T09:00:00Z');
      const defaultShiftEnd = new Date('1970-01-01T17:00:00Z');

      const receptionist = await tx.receptionists.create({
        data: {
          user_id: user.user_id,
          hospital_id: hospital.hospital_id,
          shift_start: shift_start ? new Date(`1970-01-01T${shift_start}Z`) : defaultShiftStart,
          shift_end: shift_end ? new Date(`1970-01-01T${shift_end}Z`) : defaultShiftEnd,
          status: status || "Active"
        },
        include: {
          users: true
        }
      });

      return receptionist;
    });

    return {
      id: String(newReceptionist.receptionist_id),
      name: newReceptionist.users.full_name,
      email: newReceptionist.users.email,
      phone: newReceptionist.users.phone || phone || "",
      status: newReceptionist.status,
      shift_start: newReceptionist.shift_start,
      shift_end: newReceptionist.shift_end,
    };
  }

  async updateReceptionistStatus(hospitalId: bigint, id: string, status: string) {
    const existing = await prisma.receptionists.findUnique({
      where: { receptionist_id: BigInt(id) }
    });
    
    if (!existing) throw new Error("Receptionist not found");
    if (existing.hospital_id !== hospitalId) throw new Error("Receptionist does not belong to your hospital");

    const updatedReceptionist = await prisma.receptionists.update({
      where: { receptionist_id: BigInt(id) },
      data: { status: status },
      include: {
        users: true
      }
    });

    return {
      id: String(updatedReceptionist.receptionist_id),
      name: updatedReceptionist.users.full_name,
      email: updatedReceptionist.users.email,
      status: updatedReceptionist.status,
      shift_start: updatedReceptionist.shift_start,
      shift_end: updatedReceptionist.shift_end,
    };
  }

  async updateReceptionist(hospitalId: bigint, id: string, data: any) {
    const { name, email, phone, shift_start, shift_end, status, password } = data;

    const updatedReceptionist = await prisma.$transaction(async (tx) => {
      const rec = await tx.receptionists.findUnique({ where: { receptionist_id: BigInt(id) }, include: { users: true } });
      if (!rec) throw new Error("Receptionist not found");
      if (rec.hospital_id !== hospitalId) throw new Error("Receptionist does not belong to your hospital");

      if (password) {
        // Find the user in Supabase to update their password
        const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw new Error("Failed to access auth list: " + listError.message);
        
        const authUser = authData.users.find(u => u.email === rec.users.email);
        if (authUser) {
          const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            password: password
          });
          if (updateAuthError) {
            throw new Error(`Failed to update password: ${updateAuthError.message}`);
          }
        }
      }

      // Update user details
      await tx.users.update({
        where: { user_id: rec.user_id },
        data: {
          full_name: name || rec.users.full_name,
          email: email || rec.users.email,
          ...(phone !== undefined ? { phone: phone || null } : {}),
        }
      });

      // Update receptionist details
      const defaultShiftStart = new Date('1970-01-01T09:00:00Z');
      const defaultShiftEnd = new Date('1970-01-01T17:00:00Z');

      const updated = await tx.receptionists.update({
        where: { receptionist_id: BigInt(id) },
        data: {
          shift_start: shift_start ? new Date(`1970-01-01T${shift_start}Z`) : rec.shift_start,
          shift_end: shift_end ? new Date(`1970-01-01T${shift_end}Z`) : rec.shift_end,
          status: status || rec.status
        },
        include: { users: true }
      });

      return updated;
    });

    return {
      id: String(updatedReceptionist.receptionist_id),
      name: updatedReceptionist.users.full_name,
      email: updatedReceptionist.users.email,
      phone: updatedReceptionist.users.phone || phone || "",
      status: updatedReceptionist.status,
      shift_start: updatedReceptionist.shift_start,
      shift_end: updatedReceptionist.shift_end,
    };
  }

  async deleteReceptionist(hospitalId: bigint, id: string) {
    await prisma.$transaction(async (tx) => {
      const rec = await tx.receptionists.findUnique({ where: { receptionist_id: BigInt(id) } });
      if (rec) {
        if (rec.hospital_id !== hospitalId) throw new Error("Receptionist does not belong to your hospital");
        await tx.receptionists.delete({ where: { receptionist_id: BigInt(id) } });
        await tx.users.delete({ where: { user_id: rec.user_id } });
      }
    });
    return { success: true };
  }
}

export const receptionistService = new ReceptionistService();
