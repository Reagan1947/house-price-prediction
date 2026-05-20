import Image from "next/image";
import Link from "next/link";

type LandingHeaderProps = {
  servicesHref?: string;
  loginHref?: string;
};

export function LandingHeader({
  servicesHref = "/services",
  loginHref = "/login",
}: LandingHeaderProps) {
  return (
    <header className="landing-header">
      <div className="landing-shell landing-header-inner">
        <Link className="landing-logo" href="/" aria-label="House Price Prediction home">
          <Image
            className="landing-logo-image"
            src="/landing/logo.png"
            alt="House Price Prediction"
            width={336}
            height={75}
          />
        </Link>
        <span className="sr-only">Current page: Home</span>
        <nav className="landing-nav" aria-label="Primary">
          <Link className="landing-nav-link" href={servicesHref}>
            Services
          </Link>
          <Link className="landing-btn landing-btn-primary landing-btn-sm" href={loginHref}>
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
