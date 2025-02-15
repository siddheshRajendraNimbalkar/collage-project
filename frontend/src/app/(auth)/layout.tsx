import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import "./globals.css";



export const metadata: Metadata = {
  title: "Your App Name",
  description: "Your application description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <div 
          className="min-h-screen w-full bg-cover bg-center bg-fixed"
          style={{ 
            backgroundImage: `url(/painting.jpg)`,
            backgroundBlendMode: "multiply",
            backgroundColor: "rgba(0, 0, 0, 0.3)"
          }}
        >
          <div className="container mx-auto p-4">
            {children}
          </div>
        </div>
  );
}