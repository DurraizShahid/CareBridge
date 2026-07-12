import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Raleway } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";

const raleway = Raleway({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "CareBridge Health",
    template: "%s | CareBridge Health",
  },
  description:
    "CareBridge Health helps hospital social workers and discharge planners place patients into appropriate care settings when they cannot safely return home.",
  keywords: [
    "care coordination",
    "patient placement",
    "discharge planning",
    "hospital social work",
    "care transitions",
  ],
};

const themeScript = `
(function() {
  try {
    var p = window.location.pathname;
    if (p.startsWith("/dashboard") || p.startsWith("/patients") || p.startsWith("/facilities") || p.startsWith("/placements") || p.startsWith("/admin") || p.startsWith("/hospital")) {
      var t = localStorage.getItem("dashboard-theme");
      document.documentElement.classList.toggle("dark", t === "dark");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, "font-sans", raleway.variable)}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col font-heading" suppressHydrationWarning>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
