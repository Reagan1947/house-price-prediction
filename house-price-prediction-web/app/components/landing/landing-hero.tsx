import { LandingCtaGroup } from "./landing-cta-group";

type LandingHeroProps = {
  title: string;
  description: string;
  valuationUrl: string;
  loginHref?: string;
};

export function LandingHero({
  title,
  description,
  valuationUrl,
  loginHref = "/login",
}: LandingHeroProps) {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="landing-shell">
        <div className="landing-hero-copy">
          <div className="landing-hero-content">
            <h1 className="landing-hero-title" id="landing-hero-title">
              {title}
            </h1>
            <p className="landing-hero-description">{description}</p>
            <LandingCtaGroup valuationUrl={valuationUrl} loginHref={loginHref} />
          </div>
        </div>
      </div>
    </section>
  );
}
