import { Outlet } from "react-router-dom";
import SidebarVerne from "../components/navigation/SidebarVerne";
import Breadcrumbs from "../components/Breadcrumbs";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarVerne />
      <main className="flex-1 p-6 md:p-8">
        <Breadcrumbs />
        <Outlet />
      </main>
    </div>
  );
}
