import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAdmin } from "@/lib/admin";
import { getAdminDashboardData } from "@/lib/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { follow: false, index: false },
};

export const dynamic = "force-dynamic";

export default async function EditingAppAdminPage() {
  const admin = await requireAdmin();
  const data = await getAdminDashboardData();
  return <AdminDashboard adminEmail={admin.email ?? "Administrator"} data={data} />;
}
