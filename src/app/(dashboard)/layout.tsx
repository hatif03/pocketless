import { SidebarProvider } from "@/components/ui/sidebar";

import { DashboardBottomNav } from "@/modules/dashboard/ui/components/dashboard-bottom-nav";
import { DashboardNavbar } from "@/modules/dashboard/ui/components/dashboard-navbar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className="flex flex-col h-screen w-screen bg-muted">
        <DashboardNavbar />
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</div>
        <DashboardBottomNav />
      </main>
    </SidebarProvider>
  );
};
 
export default Layout;
