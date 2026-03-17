import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import SessionGuard from "@/components/SessionGuard"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 h-screen flex flex-col`}
      >
        {/* 🔝 HEADER GLOBAL */}
        <Header />

        {/* 📄 CONTENIDO */}
        <main className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
          <SessionGuard>
            {children}
          </SessionGuard>
        </main>
      </body>
    </html>
  );
}

