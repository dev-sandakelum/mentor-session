import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ToastProvider";
import { DevBar } from "@/components/DevBar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ICTSC Mentor Session Management System",
  description:
    "ICT Students' Circle — Mentor Session 2026. Connecting junior students with experienced seniors at the Faculty of Technology, University of Ruhuna.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className}>
      <body suppressHydrationWarning>
        <ToastProvider>
          {children}
          <DevBar />
        </ToastProvider>
      </body>
    </html>
  );
}
