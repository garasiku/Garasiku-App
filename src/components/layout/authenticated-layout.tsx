import { SidebarInset, SidebarProvider } from "../shadcn/sidebar";
import { AppNavbar } from "./app-navbar";
import { Outlet } from "react-router-dom";
import { AppHeader } from "./app-header";

export function AuthenticatedLayout() {
    return (
        <SidebarProvider>
            <AppNavbar />
            <SidebarInset>
                <AppHeader></AppHeader>
                <main className="bg-[#f3f3f3]">
                    {<Outlet />}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}