import "@/styles/globals.css";
import clsx from "clsx";
import { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";

import { Providers } from "./providers";

import NavBar from "@/components/NavBar";

const neueMontrealFont = localFont({
  variable: "--font-sans",
  src: [
    {
      path: "./lib/PPNeueMontreal-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./lib/PPNeueMontreal-Italic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "./lib/PPNeueMontreal-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./lib/PPNeueMontreal-SemiBolditalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
});

export const metadata: Metadata = {
  title: {
    default: "Giuseppe Stigliano AI Avatar",
    template: `%s - Giuseppe Stigliano AI Avatar`,
  },
  icons: {
    icon: "/GS_favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      className={`${neueMontrealFont.className} h-full`}
      lang="en"
    >
      <head />
      <body className={clsx("h-full min-h-screen bg-background antialiased")}>
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <div className="min-h-full">
            <main className="relative flex flex-col h-screen w-screen mx-auto max-w-7xl px-0 sm:px-6">
              <NavBar />
              {children}
            </main>
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
