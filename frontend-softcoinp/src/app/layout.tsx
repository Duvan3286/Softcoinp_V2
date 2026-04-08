import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import SessionGuard from "@/components/SessionGuard"; 
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/context/SidebarContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "SOFTCOINP | Control de Acceso",
  description: "Sistema de Control de Acceso",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased lg:h-screen lg:overflow-hidden min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300`}
      >
        <SidebarProvider>
          <AuthProvider>
            {/* 🔝 HEADER GLOBAL */}
            <Header />

            {/* 📄 CONTENIDO */}
            <main className="flex flex-row flex-1 w-full overflow-hidden relative">
              <SessionGuard>
                <Sidebar />
                <div className="flex-1 lg:overflow-hidden overflow-y-auto bg-background w-full relative flex flex-col min-h-0 transition-colors duration-300">
                  {children}
                </div>
              </SessionGuard>
            </main>
          </AuthProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}

