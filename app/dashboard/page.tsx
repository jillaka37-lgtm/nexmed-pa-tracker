import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { PatientOverview } from "./PatientOverview";
import { StaffOverview } from "./StaffOverview";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardOverviewPage() {
  const profile = await getProfile();
  if (profile?.role === "admin") return <StaffOverview />;
  return <PatientOverview />;
}
