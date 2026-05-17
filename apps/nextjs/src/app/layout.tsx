import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthProvider } from "@acme/auth/react";
import { cn } from "@acme/ui";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { env } from "~/env";
import { ReactQueryProvider } from "~/lib/react-query";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: "Create T3 Turbo",
  description: "Simple monorepo with shared packages for web apps",
  openGraph: {
    title: "Create T3 Turbo",
    description: "Simple monorepo with shared packages for web apps",
    url: env.NEXT_PUBLIC_APP_URL,
    siteName: "Create T3 Turbo",
  },
  twitter: {
    card: "summary_large_image",
    site: "@jullerino",
    creator: "@jullerino",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen bg-[radial-gradient(circle_at_20%_0%,oklch(0.34_0.025_248/.24),transparent_30rem),radial-gradient(circle_at_80%_10%,oklch(0.30_0.045_162/.16),transparent_26rem),linear-gradient(135deg,oklch(0.10_0.012_248),oklch(0.16_0.012_248)_48%,oklch(0.09_0.01_248))] font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider>
          <AuthProvider>
            <ReactQueryProvider>{props.children}</ReactQueryProvider>
          </AuthProvider>
          <div className="absolute right-4 bottom-4">
            <ThemeToggle />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
