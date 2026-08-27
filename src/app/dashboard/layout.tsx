import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Separator } from "@/components/ui/separator";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: staffData } = await supabase
    .from("staff")
    .select("nombre_completo, email")
    .eq("id", user.id)
    .single();

  const staffUser = {
    email: user.email ?? "",
    nombre: staffData?.nombre_completo ?? undefined,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={staffUser} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-4">
          <SidebarTrigger className="-ml-1 h-7 w-7" />
          <Separator orientation="vertical" className="h-4 mx-1" />
          <span className="text-sm text-muted-foreground">
            Skin Clinic GT
          </span>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
