import { BarChart3, Calculator, Compass, FileText, Globe2, SearchCheck, SquareKanban } from "lucide-react";
import type { PortalApp } from "@/lib/portal/types";

type PortalAppIconProps = {
  icon: PortalApp["icon"];
  context?: "default" | "shortcut" | "application";
};

export function PortalAppIcon({ icon, context = "default" }: PortalAppIconProps) {
  switch (icon) {
    case "valuation":
      return context === "shortcut" || context === "application" ? (
        <Calculator aria-hidden size={32} />
      ) : (
        <BarChart3 aria-hidden size={32} />
      );
    case "analysis":
      return <Globe2 aria-hidden size={32} />;
    case "insights":
      return <SearchCheck aria-hidden size={32} />;
    case "forecast":
      return <Compass aria-hidden size={32} />;
    case "compare":
      return <SquareKanban aria-hidden size={32} />;
    case "reports":
      return <FileText aria-hidden size={32} />;
    default:
      return <BarChart3 aria-hidden size={32} />;
  }
}
