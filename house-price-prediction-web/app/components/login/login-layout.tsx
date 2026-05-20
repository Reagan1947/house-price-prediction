import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { MoveLeft } from "lucide-react";

type LoginLayoutProps = {
  children: ReactNode;
};

export function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <main id="main-content" tabIndex={-1} className="login-page" aria-labelledby="login-page-heading">
      <section className="login-visual" aria-label="Brand and hero message">
        <div className="login-visual-overlay" aria-hidden="true" />
        <header className="login-visual-header">
          <Link className="login-brand" href="/" aria-label="House Price Prediction home">
            <Image
              className="login-brand-image"
              src="/landing/logo.png"
              alt="House Price Prediction"
              width={336}
              height={75}
            />
          </Link>
        </header>

        <div className="login-hero-copy">
          <p className="login-hero-title">
            <span className="login-hero-highlight">Predict Your House Price</span>
          </p>
          <p className="login-hero-description">
            <span className="login-hero-highlight">
              Predict Your Home Price from Multiple Dimensions.
            </span>
          </p>
        </div>
      </section>

      <section className="login-auth" aria-label="Login form area">
        <div className="login-auth-panel">
          <Link className="login-back-home-btn" href="/" aria-label="Return to Home">
            <MoveLeft aria-hidden="true" />
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}
