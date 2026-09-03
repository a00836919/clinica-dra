"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarOff,
  Users,
  LayoutDashboard,
  FileImage,
  LogOut,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

const nav = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/dashboard/agenda", icon: CalendarDays, label: "Agenda" },
      { href: "/dashboard/bloqueos", icon: CalendarOff, label: "Bloqueos" },
    ],
  },
  {
    label: "Clínica",
    items: [
      { href: "/dashboard/pacientes", icon: Users, label: "Pacientes" },
      { href: "/dashboard/imagenes", icon: FileImage, label: "Imágenes" },
    ],
  },
];

export function AppSidebar({ user }: { user: { email: string; nombre?: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const initials = user.nombre
    ? user.nombre.split(" ").slice(0, 2).map((n) => n[0]).join("")
    : user.email[0].toUpperCase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="py-5 px-4">
        <div className="flex items-center gap-2.5">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.72 0.065 25)" }}
          >
            <span className="text-white text-[10px] font-bold">SC</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-foreground leading-tight truncate">
              Skin Clinic GT
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight truncate">
              Majo Polanco
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="py-3">
        {nav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] tracking-wider uppercase text-muted-foreground/70 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.label}
                        className="h-9 gap-2.5 text-sm"
                        render={
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            {active && (
                              <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
                            )}
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="pb-4 px-2">
        <SidebarSeparator className="mb-3" />
        <div className="flex items-center gap-2.5 px-2">
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarFallback
              className="text-[11px] font-semibold text-white"
              style={{ background: "oklch(0.72 0.065 25)" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-foreground truncate leading-tight">
              {user.nombre ?? user.email.split("@")[0]}
            </p>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">
              {user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
