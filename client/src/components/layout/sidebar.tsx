import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const studentNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "ri-home-5-line" },
  { href: "/self-assessment", label: "Self-Assessment", icon: "ri-mental-health-line" },
  { href: "/resources", label: "Resource Library", icon: "ri-book-open-line" },
  { href: "/chat", label: "Chat Rooms", icon: "ri-chat-3-line" },
  { href: "/appointments", label: "Book Appointments", icon: "ri-calendar-line" },
];

const counselorNavItems: NavItem[] = [
  { href: "/counselor/dashboard", label: "Dashboard", icon: "ri-home-5-line" },
  { href: "/counselor/assessments", label: "Assessments", icon: "ri-file-list-3-line" },
  { href: "/counselor/resources", label: "Manage Resources", icon: "ri-book-open-line" },
  { href: "/chat", label: "Chat", icon: "ri-chat-3-line" },
  { href: "/appointments", label: "Appointments", icon: "ri-calendar-line" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  
  const navItems = user?.role === "counselor" ? counselorNavItems : studentNavItems;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-neutral-200 bg-white h-screen">
      <div className="p-6">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-white">
            <img src="/logo.jpeg" alt="MindCare Logo" className="object-cover w-full h-full" />
          </div>
          <h1 className="ml-3 text-xl font-heading font-bold text-neutral-800">MindCare</h1>
        </div>
        
        {/* User ID Display */}
        <div className="mt-6 flex items-center p-3 bg-neutral-100 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center">
            <i className="ri-user-line text-neutral-600"></i>
          </div>
          <div className="ml-3">
            <span className="text-xs text-neutral-500">User ID</span>
            <div className="text-sm font-medium text-neutral-700">
              {user?.username || "Loading..."}
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="mt-2 flex-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cn(
                "flex items-center px-6 py-3 font-medium",
                location === item.href
                  ? "text-primary bg-primary-light"
                  : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <i className={cn(item.icon, "mr-3 text-lg")}></i>
              <span>{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>
      
      {/* Logout */}
      <div className="p-6 border-t border-neutral-200">
        <Button
          variant="ghost"
          onClick={() => logout()}
          className="flex items-center w-full justify-start text-neutral-600 hover:text-neutral-800"
        >
          <i className="ri-logout-box-line mr-2"></i>
          <span>Log out</span>
        </Button>
      </div>
    </aside>
  );
}
