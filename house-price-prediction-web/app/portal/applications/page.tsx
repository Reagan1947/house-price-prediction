import type { Metadata } from "next";
import { PortalApplications } from "@/app/components/portal/portal-applications";

export const metadata: Metadata = {
  title: "Applications | House Price Prediction",
  description: "Browse and filter applications available to your account.",
};

export default function PortalApplicationsPage() {
  return <PortalApplications />;
}
