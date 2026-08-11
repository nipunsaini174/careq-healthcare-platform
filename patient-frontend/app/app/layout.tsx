import { Layout } from "@/components/Layout";
import { RouteGuard } from "@/components/RouteGuard";
import { NotificationListener } from "@/components/NotificationListener";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <RouteGuard>
        <NotificationListener />
        {children}
      </RouteGuard>
    </Layout>
  );
}
