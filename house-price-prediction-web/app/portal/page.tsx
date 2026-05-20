import type { Metadata } from "next";
import { PortalHome } from "@/app/components/portal/portal-home";

export const metadata: Metadata = {
  title: "Portal | House Price Prediction",
  description: "Application portal home with shortcut, advice, and recent activities.",
};

export default function PortalPage() {
  return <PortalHome />;
}
