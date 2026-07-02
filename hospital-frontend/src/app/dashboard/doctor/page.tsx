import DoctorDashboard from "@/components/doctor/DoctorDashboard";
import { ThemeProvider } from "@/components/doctor/contexts/ThemeContext";
import { SocketProvider } from "@/components/doctor/contexts/SocketContext";

export default function DoctorDashboardPage() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <DoctorDashboard />
      </SocketProvider>
    </ThemeProvider>
  );
}
