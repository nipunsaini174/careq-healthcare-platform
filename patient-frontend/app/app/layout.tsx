import { Layout } from "@/components/Layout";
import { RouteGuard } from "@/components/RouteGuard";
import { NotificationListener } from "@/components/NotificationListener";
import { PatientAiAssistant } from "@/components/ai/PatientAiAssistant";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <RouteGuard>
        <NotificationListener />
        {children}
        <PatientAiAssistant />
      </RouteGuard>
    </Layout>
  );
}
