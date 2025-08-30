import { ChevronDown, X } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubItem, SidebarSeparator, SidebarTrigger, useSidebar
} from "../shadcn/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "../shadcn/collapsible";
import { Button } from "../shadcn/button";
import {
  Link, useLocation, useNavigate
} from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "../shadcn/alert-dialog";
import { useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context";
import { ADMIN, DIVISI, DRIVER, OWNER, WSHEAD } from "@/lib/constants";

const items = [
  { title: "Dashboard", url: "dashboard", roles: [OWNER, DIVISI, WSHEAD, DRIVER, ADMIN] },
  {
    title: "Garasi", url: "garasi", roles: [OWNER, DIVISI, WSHEAD, DRIVER], child: [
      { title: "Daftar Kendaraan", url: "daftar-kendaraan/active", roles: [OWNER, DIVISI] },
      { title: "Cari Kendaraan", url: "cari-kendaraan", roles: [OWNER, DIVISI, WSHEAD, DRIVER] },
    ]
  },
  { title: "Servis", url: "servis", roles: [OWNER, DIVISI, WSHEAD] },
  {
    title: "Administrasi", url: "administrasi", roles: [OWNER, DIVISI], child: [
      { title: "STNK 1 Tahun", url: "stnk-1", roles: [OWNER, DIVISI] },
      { title: "STNK 5 Tahun", url: "stnk-5", roles: [OWNER, DIVISI] },
      { title: "Asuransi", url: "asuransi", roles: [OWNER, DIVISI] },
    ]
  },
  { title: "User", url: "user", roles: [ADMIN] },
  { title: "Parameter", url: "parameter", roles: [ADMIN] },
];

export function AppNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setOpenMobile, toggleSidebar } = useSidebar();

  const { user, role } = useAuth();

  const userMeta = useMemo(() => {
    if (!user) return null;
    const meta = user.user_metadata || {};
    return {
      fullname: meta.fullname || "Nama Pengguna",
      username: meta.username || user.email?.split("@")[0] || "nama pengguna",
    };
  }, [user]);

  const handleLogout = useCallback(async () => {
    setOpenMobile(false);

    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate("/login");
    }, 300);
  }, [navigate]);

  const handleMenuClick = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  const avatarLetter = useMemo(() => {
    const str = userMeta?.fullname || userMeta?.username || "U";
    return str.charAt(0).toUpperCase();
  }, [userMeta]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex items-start justify-between group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:py-3">
            {userMeta && (
              <SidebarMenuItem className="group-data-[state=collapsed]:hidden">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-lg">
                      {avatarLetter}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-medium text-sm">
                      {userMeta?.fullname}
                    </h2>
                    <p className="text-xs text-medium">
                      {userMeta?.username}
                    </p>
                  </div>
                </div>
              </SidebarMenuItem>
            )}
            <Button onClick={toggleSidebar} size="icon" variant="ghost" asChild className="lg:hidden">
              <X className="w-5 h-5" />
            </Button>
            <SidebarTrigger className="hidden lg:flex" />
          </div>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className="my-2 group-data-[state=collapsed]:hidden" />

      <SidebarContent className="group-data-[state=collapsed]:hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items
                .filter(item => !item.roles || item.roles.includes(role || ""))
                .map((item) => (
                  item.child ? (
                    <SidebarMenuItem key={item.title}>
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="flex items-center justify-between group">
                            <span>{item.title}</span>
                            <ChevronDown className="w-4 h-4 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.child
                              .filter(subItem => !subItem.roles || subItem.roles.includes(role || ""))
                              .map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuButton
                                    asChild
                                    isActive={pathname === `/${item.url}/${subItem.url}`}
                                    onClick={handleMenuClick}
                                  >
                                    <Link to={`/${item.url}/${subItem.url}`}>
                                      {subItem.title}
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuSubItem>
                              ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  ) : (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/${item.url}`}
                        onClick={handleMenuClick}
                      >
                        <Link to={`/${item.url}`}>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="my-2 group-data-[state=collapsed]:hidden" />

      <SidebarFooter className="group-data-[state=collapsed]:hidden">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default">Keluar</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Keluar Aplikasi?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin keluar dari aplikasi?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Tidak</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Ya</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>
  );
}
