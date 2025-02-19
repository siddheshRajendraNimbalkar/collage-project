'use client'

import Footer from "@/components/Custom/common/Footer";
import Navbar from "@/components/Custom/common/Navebar";
import SearchBar from "@/components/Custom/common/SearchBar";
import SwiperSlider from "@/components/Custom/common/slider";
import SlidingProductCard from "@/components/Custom/common/slider";

export default function Home() {
  return (
    <>
      <div className="relative z-50">
        <Navbar />
      </div>

      <div className="min-h-[25vh] pt-6 relative z-50 border-b-[1px] border-white">
        <SearchBar />
      </div>
      <div>
        <SwiperSlider
          slides={[
            {
              name: "Premium Headphones",
              type: "Wireless",
              category: "Audio",
              description: "High-fidelity sound with active noise cancellation...",
              price: "$299.99",
              image: "https://imgs.search.brave.com/4T1tXMwOsde3rGFLxrzSkXTjG3_oUCqg7bpedgy7R4E/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9idXJz/dC5zaG9waWZ5Y2Ru/LmNvbS9waG90b3Mv/bWlsa3NoYWtlLW9u/LXBpbmsuanBnP3dp/ZHRoPTEwMDAmZm9y/bWF0PXBqcGcmZXhp/Zj0wJmlwdGM9MA"
            },
            {
              name: "Hello",
              type: "Wireless",
              category: "Audio",
              description: "High-fidelity sound with active noise cancellation...",
              price: "$299.99",
              image: "https://imgs.search.brave.com/UPZgGcPqu58U8_DREvbHhAMcuIQdNjcpznRZ9KHJPCA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9waXhs/ci5jb20vaW1hZ2Vz/L2luZGV4L2FpLWlt/YWdlLWdlbmVyYXRv/ci1vbmUud2VicA    "
            },
            {
              name: "Premium Headphones",
              type: "Wireless",
              category: "Audio",
              description: "High-fidelity sound with active noise cancellation...",
              price: "$299.99",
              image: "https://imgs.search.brave.com/4NuAAlsheUY8lUmNA0eYgi4it1g4ZyZ40lAVdXmwk0k/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/cGl4YWJheS5jb20v/cGhvdG8vMjAyMy8x/MC8yNy8xMC8yOC93/b21hbi04MzQ0OTQ0/XzY0MC5qcGc"
            },
            {
              name: "Premium Headphones",
              type: "Wireless",
              category: "Audio",
              description: "High-fidelity sound with active noise cancellation...",
              price: "$299.99",
              image: "https://imgs.search.brave.com/ti7F41pW3oNrqH6FqBXQEqUEzFDnl1Wf-F8YtVViYTU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9waXhs/ci5jb20vaW1hZ2Vz/L2luZGV4L3Byb2R1/Y3QtaW1hZ2Utb25l/LndlYnA"
            },
            // Add more slides
          ]}
        />
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}
