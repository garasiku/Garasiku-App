import { Menu } from "lucide-react";
import { useSidebar } from "../shadcn/sidebar";
import { Button } from "../shadcn/button";
import faviconLight from "@/assets/favicon.png"
import faviconDark from "@/assets/favicon-2.png"

export function AppHeader() {
    const { toggleSidebar } = useSidebar()

    return (
        <header className="border-b w-full bg-background/70 backdrop-blur-md shadow-sm p-4 flex justify-between items-center sticky top-0 z-50 lg:hidden">
            <div>
                <img
                    src={faviconLight}
                    alt="Logo"
                    className="h-6 w-auto dark:hidden"
                />
                <img
                    src={faviconDark}
                    alt="Logo Dark"
                    className="h-6 w-auto hidden dark:block"
                />
            </div>
            <Button onClick={toggleSidebar} size="icon" variant="ghost" asChild>
                <Menu className="w-6 h-6" />
            </Button>
        </header>
    )
}