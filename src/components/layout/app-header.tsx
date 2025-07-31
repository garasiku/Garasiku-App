import { Menu } from "lucide-react";
import { useSidebar } from "../shadcn/sidebar";
import { Button } from "../shadcn/button";

export function AppHeader() {
    const { toggleSidebar } = useSidebar()

    return (
        <header className="border-b w-full bg-background/70 backdrop-blur-md shadow-sm p-4 flex justify-end items-center sticky top-0 z-50 lg:hidden">
            <Button onClick={toggleSidebar} size="icon" variant="ghost" asChild>
                <Menu className="w-6 h-6" />
            </Button>
        </header>
    )
}