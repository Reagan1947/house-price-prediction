import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LoginLayout } from "@/app/components/login/login-layout";
import { LoginForm } from "@/app/components/login/login-form";
import { hasActiveSession } from "@/lib/auth/session";

const portalPath = process.env.NEXT_PUBLIC_PORTAL_PATH ?? "/portal";

export const metadata: Metadata = {
  title: "Login | House Price Prediction",
  description: "Sign in to access the house price prediction portal.",
};

export default async function LoginPage() {
  if (await hasActiveSession()) {
    redirect(portalPath);
  }

  return (
    <LoginLayout>
      <LoginForm portalPath={portalPath} />
    </LoginLayout>
  );
}
