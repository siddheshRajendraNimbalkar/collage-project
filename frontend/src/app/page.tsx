"use client";

import Footer from "@/components/Custom/common/Footer";
import Navebar from "@/components/Custom/common/Navebar";
import SearchBar from "@/components/Custom/common/SearchBar";

export default function Home() {
  return (
    <>
      {/* Navbar */}
      <div className="relative z-50">
        <Navebar />
      </div>

      {/* Search Bar */}
      <div className="mt-10 mb-20 z-40 relative">
        <SearchBar />
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}
