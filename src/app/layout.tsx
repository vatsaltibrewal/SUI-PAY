import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { SuiProvider } from "@/components/providers/SuiProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/toaster";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SuiPay - Neo-Brutalist Tipping Platform",
  description: "A bold, high-contrast tipping platform with SuiNS and SUI wallet integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={ibmPlexSans.variable}>
      <body className="antialiased">
        <SuiProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </SuiProvider>
      </body>
    </html>
  );
}
