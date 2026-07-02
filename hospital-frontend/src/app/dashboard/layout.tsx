import { protectRoute } from "../../lib/proxy";
import { NotificationListener } from "@/components/shared/NotificationListener";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await protectRoute();

  return (
    <>
      <NotificationListener />
      {children}
    </>
  );
}
