import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import MobileNav from "./mobile-nav";

interface PageLayoutProps {
  children?:ReactNode;
  title?: string;
  description?: string;
  headerContent?: ReactNode;
}

export default function PageLayout({ children, title, description, headerContent }: PageLayoutProps) {
  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* Sidebar (Desktop) */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 pb-20 lg:pb-6">
          {/* {(title || description) && (
            <div className="mb-6">
              {title && <h2 className="text-2xl font-heading font-bold text-neutral-800">{title}</h2>}
              {description && <p className="text-neutral-600 mt-1">{description}</p>}
            </div>
            
          )} */}
          {(title || description || headerContent) && (
            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                {title && <h2 className="text-2xl font-heading font-bold text-neutral-800">{title}</h2>}
                {description && <p className="text-neutral-600 mt-1">{description}</p>}
              </div>
              {headerContent && (
                <div className="mt-4 lg:mt-0 flex gap-2">
                  {headerContent}
                </div>
              )}
            </div>
          )}
          {children}
        </main>
        
        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}
