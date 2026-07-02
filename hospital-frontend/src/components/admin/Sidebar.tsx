"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  UserRound, 
  CreditCard, 
  FileText, 
  Bell,
  Radio,
  Settings,
  UserCog
} from "lucide-react";

import { SidebarBrand } from "@/components/shared/SidebarBrand";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Patients", href: "/dashboard/admin/patients", icon: Users },
    { name: "Receptionists", href: "/dashboard/admin/receptionists", icon: UserRound },
    { name: "Staff", href: "/dashboard/admin/staff", icon: UserCog },
    { name: "Billing", href: "/dashboard/admin/billing", icon: CreditCard },
    { name: "Reports", href: "/dashboard/admin/reports", icon: FileText },
    { name: "Broadcast", href: "/dashboard/admin/broadcast", icon: Radio },
    { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-lg h-full flex flex-col hidden md:flex">
      <SidebarBrand appName="MediCore" role="HOSPITAL ADMIN" />
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-semibold" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 mt-auto">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">Need help?</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1 mb-3">Contact IT Support</p>
          <button className="w-full bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 text-sm font-semibold py-2 rounded-lg shadow-sm border border-transparent dark:border-gray-700">
            Support
          </button>
        </div>
      </div>
    </div>
  );
}
