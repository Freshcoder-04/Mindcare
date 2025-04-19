import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, useLocation } from "wouter";

export default function Header() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/75 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <i className="ri-menu-line text-neutral-600"></i>
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-neutral-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                    <i className="ri-mental-health-line"></i>
                  </div>
                  <h1 className="ml-2 text-lg font-heading font-bold text-neutral-800">MindCare</h1>
                </div>
              </div>
              
              <nav className="flex-1">
                {user?.role === "student" ? (
                  <>
                    <NavLink href="/dashboard" icon="ri-home-5-line" label="Dashboard" onOpenChange={setMobileMenuOpen} />
                    <NavLink href="/self-assessment" icon="ri-mental-health-line" label="Self-Assessment" onOpenChange={setMobileMenuOpen} />
                    <NavLink href="/resources" icon="ri-book-open-line" label="Resource Library" onOpenChange={setMobileMenuOpen} />
                    <NavLink href="/chat" icon="ri-chat-3-line" label="Chat Rooms" onOpenChange={setMobileMenuOpen} />
                    <NavLink href="/appointments" icon="ri-calendar-line" label="Book Appointments" onOpenChange={setMobileMenuOpen} />
                  </>
                ) : (
                  <>
                    <NavLink href="/counselor/dashboard" icon="ri-home-5-line" label="Dashboard" onOpenChange={setMobileMenuOpen} />
                    <NavLink href="/counselor/assessments" icon="ri-file-list-3-line" label="Assessments" onOpenChange={setMobileMenuOpen} />
                    <NavLink href="/counselor/resources" icon="ri-book-open-line" label="Manage Resources" onOpenChange={setMobileMenuOpen} />
                    <NavLink href="/chat" icon="ri-chat-3-line" label="Chat" onOpenChange={setMobileMenuOpen} />
                    <NavLink href="/appointments" icon="ri-calendar-line" label="Appointments" onOpenChange={setMobileMenuOpen} />
                  </>
                )}
              </nav>
              
              <div className="p-4 border-t border-neutral-200">
                <Button
                  variant="ghost"
                  onClick={() => logout()}
                  className="flex items-center w-full justify-start text-neutral-600 hover:text-neutral-800"
                >
                  <i className="ri-logout-box-line mr-2"></i>
                  <span>Log out</span>
                </Button>
              </div>
            </div>
<<<<<<< HEAD
          </SheetContent>
        </Sheet>
=======
            
            <nav className="flex-1">
              {role === "student" ? (
                <>
                  <NavLink href="/dashboard" icon="ri-home-5-line" label="Dashboard" onOpenChange={setMobileMenuOpen} />
                  <NavLink href="/self-assessment" icon="ri-mental-health-line" label="Self-Assessment" onOpenChange={setMobileMenuOpen} />
                  <NavLink href="/resources" icon="ri-book-open-line" label="Resource Library" onOpenChange={setMobileMenuOpen} />
                  <NavLink href="/chat" icon="ri-chat-3-line" label="Chat Rooms" onOpenChange={setMobileMenuOpen} />
                  <NavLink href="/appointments" icon="ri-calendar-line" label="Book Appointments" onOpenChange={setMobileMenuOpen} />
                </>
              ) : (
                <>
                  <NavLink href="/counselor/dashboard" icon="ri-home-5-line" label="Dashboard" onOpenChange={setMobileMenuOpen} />
                  <NavLink href="/counselor/assessments" icon="ri-file-list-3-line" label="Assessments" onOpenChange={setMobileMenuOpen} />
                  <NavLink href="/counselor/resources" icon="ri-book-open-line" label="Manage Resources" onOpenChange={setMobileMenuOpen} />
                  <NavLink href="/chat" icon="ri-chat-3-line" label="Chat" onOpenChange={setMobileMenuOpen} />
                  <NavLink href="/counselor/slots" icon="ri-calendar-line" label="Manage Available Slots" onOpenChange={setMobileMenuOpen} />
                </>
              )}
            </nav>
            
            <div className="p-4 border-t border-neutral-200">
              <Button
                variant="ghost"
                onClick={() => logout()}
                className="flex items-center w-full justify-start text-neutral-600 hover:text-neutral-800"
              >
                <i className="ri-logout-box-line mr-2"></i>
                <span>Log out</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* View Toggle (Student/Counselor) */}
      {user?.role === "counselor" && (
        <div className="hidden lg:flex">
          <span className="text-sm text-neutral-500">Current view:</span>
          <div className="ml-2 relative inline-block">
            <select
              className="appearance-none bg-neutral-100 pl-3 pr-8 py-1 rounded-md text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary"
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as "student" | "counselor")}
            >
              <option value="student">Student</option>
              <option value="counselor">Counselor</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-600">
              <i className="ri-arrow-down-s-line"></i>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Title */}
      <div className="lg:hidden flex items-center">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
          <i className="ri-mental-health-line"></i>
        </div>
        <h1 className="ml-2 text-lg font-heading font-bold text-neutral-800">MindCare</h1>
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <i className="ri-notification-3-line text-neutral-600"></i>
          <span className="sr-only">Notifications</span>
        </Button>
>>>>>>> 81483ada (Appointment booking)
        
        {/* Mobile Title */}
        <div className="lg:hidden flex items-center">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <i className="ri-mental-health-line"></i>
          </div>
          <h1 className="ml-2 text-lg font-heading font-bold text-neutral-800">MindCare</h1>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <i className="ri-notification-3-line text-neutral-600"></i>
            <span className="sr-only">Notifications</span>
          </Button>
          
          <Button variant="ghost" size="icon" className="lg:hidden">
            <i className="ri-user-line text-neutral-600"></i>
            <span className="sr-only">User</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  icon: string;
  label: string;
  onOpenChange: (open: boolean) => void;
}

function NavLink({ href, icon, label, onOpenChange }: NavLinkProps) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href}>
      <a
        className={`flex items-center px-4 py-3 text-base ${
          isActive
            ? "text-primary bg-primary-light font-medium"
            : "text-neutral-600 hover:bg-neutral-100 font-medium"
        }`}
        onClick={() => onOpenChange(false)}
      >
        <i className={`${icon} mr-3 text-lg`}></i>
        <span>{label}</span>
      </a>
    </Link>
  );
}
