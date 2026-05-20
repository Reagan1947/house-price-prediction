import { redirect } from "next/navigation";
import { PortalHeader } from "@/app/components/portal/portal-header";
import { PortalSidenav } from "@/app/components/portal/portal-sidenav";
import { getAuthTokenFromCookies, getCurrentUser } from "@/lib/auth/session";

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    redirect("/login");
  }

  const currentUser = await getCurrentUser();
  const displayUserName = currentUser?.username || currentUser?.email || "User";

  return (
    <div className="portal-page">
      <PortalHeader userName={displayUserName} />
      <div className="portal-shell">
        <PortalSidenav />
        <main id="main-content" tabIndex={-1} className="portal-main-content">
          <div className="portal-main-content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
