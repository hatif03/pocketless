import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next";

import { RegisterServiceWorker } from "@/components/register-service-worker";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/client";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pocketless",
  description:
    "A coworker in your calls. Silent until you say Pocketless. Remembers people and promises.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pocketless",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16A34A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NuqsAdapter>
      <TRPCReactProvider>
        <html lang="en">
          <body
            className={`${inter.className} antialiased`}
          >
            <Toaster />
            <RegisterServiceWorker />
            {children}
          </body>
        </html>
      </TRPCReactProvider>
    </NuqsAdapter>
  );
}
