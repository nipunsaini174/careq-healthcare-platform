import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function protectRoute() {
  const cookieStore = await cookies();
  const token = cookieStore.get('healthflow-admin-token')?.value;
  
  if (!token) {
    redirect('/login');
  }
}
