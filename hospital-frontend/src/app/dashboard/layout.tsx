import { protectRoute } from "../../lib/proxy";
import { NotificationListener } from "@/components/shared/NotificationListener";
import { HospitalAiAssistant } from "@/components/ai/HospitalAiAssistant";

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
      <HospitalAiAssistant />
    </>
  );
}
