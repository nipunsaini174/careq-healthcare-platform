import { ReceptionistProfileProvider } from '@/contexts/ReceptionistProfileContext';
import { ReceptionistRoleGate } from '@/components/receptionist/ReceptionistRoleGate';
import ReceptionistShell from '@/components/receptionist/ReceptionistShell';

export default function ReceptionistLayout({ children }) {
  return (
    <ReceptionistRoleGate>
      <ReceptionistProfileProvider>
        <ReceptionistShell>{children}</ReceptionistShell>
      </ReceptionistProfileProvider>
    </ReceptionistRoleGate>
  );
}
