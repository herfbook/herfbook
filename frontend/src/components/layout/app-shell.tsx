import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageMetaProvider } from "@/components/layout/page-title-context";

export function AppShell() {
  return (
    <PageMetaProvider>
      <SidebarProvider>
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:flex">
          <AppSidebar />
        </div>

        <SidebarInset className="flex flex-col min-h-screen">
          <TopBar />

          {/* Main content */}
          <main className="flex-1 px-4 py-6 md:px-6 pb-20 md:pb-6">
            <div className="mx-auto max-w-5xl">
              <Outlet />
            </div>
          </main>
        </SidebarInset>

        {/* Mobile bottom nav — hidden on desktop */}
        <MobileNav />
      </SidebarProvider>
    </PageMetaProvider>
  );
}
