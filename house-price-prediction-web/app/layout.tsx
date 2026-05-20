import type { Metadata } from "next";
import "./globals.css";
import { SkipLink } from "./components/accessibility/skip-link";
import { WindowsScaleCompensator } from "./components/accessibility/windows-scale-compensator";

export const metadata: Metadata = {
  title: "House Price Prediction",
  description: "Use machine learning models to predict your property price information.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <WindowsScaleCompensator />
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
