import Link from "next/link";

type LandingCtaGroupProps = {
  valuationUrl: string;
  loginHref?: string;
};

const isExternalUrl = (url: string): boolean => /^https?:\/\//.test(url);

export function LandingCtaGroup({
  valuationUrl,
  loginHref = "/login",
}: LandingCtaGroupProps) {
  const external = isExternalUrl(valuationUrl);

  return (
    <div className="landing-cta-group" role="group" aria-label="Primary actions">
      {external ? (
        <a
          className="landing-btn landing-btn-primary"
          href={valuationUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Predict Now <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : (
        <Link className="landing-btn landing-btn-primary" href={valuationUrl}>
          Predict Now
        </Link>
      )}
      <Link className="landing-btn landing-btn-outline" href={loginHref}>
        Login <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
