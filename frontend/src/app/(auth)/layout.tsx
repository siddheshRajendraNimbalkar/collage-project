'use client'

import AuthBG from "@/components/Custom/backgrounds/AuthBG";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <div 
          className="min-h-screen w-full bg-cover bg-center bg-fixed"
        >
          <AuthBG>

          <div className="container mx-auto p-4">
            {children}
          </div>
          </AuthBG>
        </div>
  );
}