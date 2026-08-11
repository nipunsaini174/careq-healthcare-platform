"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  UserRound, 
  CreditCard, 
  FileText, 
  Radio,
  Settings,
  UserCog,
  X,
} from "lucide-react";

import { SidebarBrand } from "@/components/shared/SidebarBrand";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose = () => {} }: SidebarProps) {
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
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] shrink-0 flex-col border-r border-gray-100 bg-white shadow-lg transition-transform duration-200 dark:border-gray-800 dark:bg-gray-900
        md:static md:z-auto md:translate-x-0 md:w-56 lg:w-64
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="flex items-center justify-between md:block">
        <SidebarBrand appName="MediCore" role="HOSPITAL ADMIN" />
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="mr-3 rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
        >
          <X size={20} />
        </button>
      </div>
      
      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3 sm:px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors sm:px-4 sm:py-3 ${
                isActive 
                  ? "bg-green-50 font-semibold text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto p-4 sm:p-6">
        <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">Need help?</p>
          <p className="mt-1 mb-3 text-xs text-green-600 dark:text-green-400">Contact IT Support</p>
          <button type="button" className="w-full rounded-lg border border-transparent bg-white py-2 text-sm font-semibold text-green-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-green-400">
            Support
          </button>
        </div>
      </div>
    </aside>
  );
}
