import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Lato } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SmoothScroll } from "@/components/smooth-scroll";

const inter = localFont({
  src: [{ path: "../../public/fonts/helvetica/Inter-Variable.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
});

const lato = Lato({ subsets: ["latin"], weight: ["300", "400", "700", "900"], variable: "--font-lato", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "CareBridge Health | Hospital-to-Care-Home Placement",
    template: "%s | CareBridge Health",
  },
  description: "CareBridge Health helps hospital social workers and discharge planners match patients with appropriate care facilities, manage referrals, contracts, and placement workflows.",
  applicationName: "CareBridge Health",
  keywords: ["care coordination", "patient placement", "discharge planning", "hospital social work", "care transitions"],
  metadataBase: new URL("https://carebridge.health"),
  openGraph: {
    title: "CareBridge Health | Hospital-to-Care-Home Placement",
    description: "A modern placement workflow connecting hospitals, discharge planners, and care facilities.",
    type: "website",
    siteName: "CareBridge Health",
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630, alt: "CareBridge Health placement platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CareBridge Health | Hospital-to-Care-Home Placement",
    description: "Connect patients with the right care setting through one coordinated workflow.",
    images: ["/brand/og-image.png"],
  },
  icons: {
    icon: [{ url: "/brand/carebridge-favicon.svg", type: "image/svg+xml" }, { url: "/brand/carebridge-favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/brand/carebridge-app-icon-512.png", sizes: "512x512" }],
    shortcut: "/brand/favicon.ico",
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem("dashboard-theme");document.documentElement.classList.toggle("dark",t==="dark");}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={cn("h-full", "antialiased", inter.variable, lato.variable, "font-sans")} suppressHydrationWarning>
    <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
      <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
      <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up"><SmoothScroll>{children}</SmoothScroll></ClerkProvider>
    </body>
  </html>;
}
