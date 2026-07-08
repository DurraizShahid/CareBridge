import type { Metadata } from "next";
import { Lato, Open_Sans } from "next/font/google";
import "./globals.css";

const lato = Lato({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const openSans = Open_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lato.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
