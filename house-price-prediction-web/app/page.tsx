import type { Metadata } from "next";
import { LandingHeader } from "./components/landing/landing-header";
import { LandingHero } from "./components/landing/landing-hero";

const heroTitle = "Efficiently Predict Your House Price";
const heroDescription =
  "Use machine learning models to predict your property price information based on multidimensional data prediction.";

export const metadata: Metadata = {
  title: "House Price Prediction",
  description: heroDescription,
};

export default function HomePage() {
  const valuationUrl = process.env.NEXT_PUBLIC_VALUATION_URL ?? "/valuation";

  return (
    <div className="landing-page">
      <LandingHeader />
      <main id="main-content" tabIndex={-1}>
        <LandingHero
          title={heroTitle}
          description={heroDescription}
          valuationUrl={valuationUrl}
        />
      </main>
    </div>
  );
}
