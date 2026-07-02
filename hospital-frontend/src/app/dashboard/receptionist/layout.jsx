import EnterpriseSidebar from '@/components/receptionist/Enterprise/EnterpriseSidebar';
import EnterpriseHeader from '@/components/receptionist/Enterprise/EnterpriseHeader';

export default function ReceptionistLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900 w-full">
      <EnterpriseSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <EnterpriseHeader />
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full relative">
            {children}
        </main>
      </div>
    </div>
  );
}
