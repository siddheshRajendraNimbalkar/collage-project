"use client";

import Navebar from "@/components/Custom/common/Navebar";
import Footer from "@/components/Custom/common/Footer";
import SearchBar from "@/components/Custom/common/SearchBar";
import { useParams } from "next/navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const params = useParams();
  const category = params?.category as string | undefined;

  const categoryBgColors: Record<string, string> = {
    Art: "#FFFF00",
    Poster: "#7B68EE",
    Design: "#FF4500",
    Tech: "#4169E1",
    Photography: "#C71585",
    Fashion: "#8B008B",
    Electronics: "#4B0082",
    Books: "#008000",
  };

  const bgColor = category ? categoryBgColors[category] || "transparent" : "transparent";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="relative z-50">
        <Navebar />
      </header>

      {/* Category Header Section */}
      <section
        className="min-h-[30vh] flex flex-col justify-center items-center text-center 
                   transition-all duration-500 shadow-md"
        style={{ backgroundColor: bgColor }}
      >
        <SearchBar />
        {category && (
          <h1 className="text-5xl md:text-6xl font-bold text-black mt-4 capitalize">
            {category.toUpperCase()}
          </h1>
        )}
      </section>

      {/* Main Content */}
      <main className="flex-grow w-full px-6 md:px-12 lg:px-24 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  );
};

export default Layout;
