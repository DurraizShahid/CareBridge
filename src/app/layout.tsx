import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";

const nohemi = localFont({
  src: [
    { path: "../../public/fonts/Nohemi-Thin.woff2", weight: "100", style: "normal" },
    { path: "../../public/fonts/Nohemi-ExtraLight.woff2", weight: "200", style: "normal" },
    { path: "../../public/fonts/Nohemi-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/Nohemi-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/Nohemi-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/Nohemi-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/Nohemi-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-nohemi",
  display: "swap",
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
      className={cn("h-full", "antialiased", nohemi.variable, "font-sans")}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
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
