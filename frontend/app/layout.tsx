import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RainbowKitAndWagmiProvider from "./RainbowKitAndWagmiProvider";
import Layout from "../components/shared/Layout";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dvoting",
  description: "Decentralized voting dApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <RainbowKitAndWagmiProvider>
          <Layout>
            {children}
            <Toaster
              position="bottom-right"
              richColors={false}
              closeButton={false}
              duration={3000}
              className="z-50"
              toastOptions={{
                style: {
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  fontSize: "14px",
                  padding: "12px 16px",
                },
              }}
            />
          </Layout>
        </RainbowKitAndWagmiProvider>
      </body>
    </html>
  );
}
