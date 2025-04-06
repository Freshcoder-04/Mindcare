import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/contexts/user-role-context";

export default function MobileNav() {
  const [location] = useLocation();
  const { role } = useUserRole();
  
  return (
    <nav className="lg:hidden flex items-center justify-between fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 py-2 z-10">
      {role === "student" ? (
        <>
          <NavItem
            href="/dashboard"
            icon="ri-home-5-line"
            label="Home"
            isActive={location === "/dashboard"}
          />
          <NavItem
            href="/self-assessment"
            icon="ri-mental-health-line"
            label="Assessment"
            isActive={location === "/self-assessment"}
          />
          <NavItem
            href="/resources"
            icon="ri-book-open-line"
            label="Resources"
            isActive={location === "/resources"}
          />
          <NavItem
            href="/chat"
            icon="ri-chat-3-line"
            label="Chat"
            isActive={location === "/chat"}
          />
          <NavItem
            href="/appointments"
            icon="ri-calendar-line"
            label="Book"
            isActive={location === "/appointments"}
          />
        </>
      ) : (
        <>
          <NavItem
            href="/counselor/dashboard"
            icon="ri-home-5-line"
            label="Home"
            isActive={location === "/counselor/dashboard"}
          />
          <NavItem
            href="/counselor/assessments"
            icon="ri-file-list-3-line"
            label="Assess"
            isActive={location === "/counselor/assessments"}
          />
          <NavItem
            href="/counselor/resources"
            icon="ri-book-open-line"
            label="Resources"
            isActive={location === "/counselor/resources"}
          />
          <NavItem
            href="/chat"
            icon="ri-chat-3-line"
            label="Chat"
            isActive={location === "/chat"}
          />
          <NavItem
            href="/appointments"
            icon="ri-calendar-line"
            label="Appts"
            isActive={location === "/appointments"}
          />
        </>
      )}
    </nav>
  );
}

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href}>
      <a className={cn("flex flex-col items-center py-2", isActive ? "text-primary" : "text-neutral-500")}>
        <i className={cn(icon, "text-xl")}></i>
        <span className="text-xs mt-1">{label}</span>
      </a>
    </Link>
  );
}
