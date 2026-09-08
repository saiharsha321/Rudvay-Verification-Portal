import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { Navbar } from "@/components/ui/navbar";

export const metadata: Metadata = {
  title: "Rudvay Tech Certificate Platform | Official Verification & Issuance",
  description: "Official serverless certificate generation, automated delivery, and instant cryptographic verification platform for Rudvay Tech.",
  keywords: ["Rudvay Tech", "Certificate Verification", "Secure Certificates", "QR Code Verification"],
  openGraph: {
    title: "Rudvay Tech Certificate Platform",
    description: "Verify and manage authentic Rudvay Tech issued certificates.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#03070D] text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <footer className="border-t border-slate-800/60 bg-slate-950/80 py-8 text-center text-sm text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-slate-300">RUDVAY TECH</span>
                <span className="text-slate-600">|</span>
                <span>Certificate Authority System</span>
              </div>
              <div className="text-xs text-slate-500">
                &copy; {new Date().getFullYear()} Rudvay Tech. All rights reserved. Zero-Storage In-Memory Security.
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
