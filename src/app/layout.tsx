import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Lato } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SmoothScroll } from "@/components/smooth-scroll";

const inter = localFont({
  src: [
    { path: "../../public/fonts/helvetica/Inter-Variable.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
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
    var t = localStorage.getItem("dashboard-theme");
    document.documentElement.classList.toggle("dark", t === "dark");
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
      className={cn("h-full", "antialiased", inter.variable, lato.variable, "font-sans")}
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
          <SmoothScroll>{children}</SmoothScroll>
        </ClerkProvider>
      </body>
    </html>
  );
}
