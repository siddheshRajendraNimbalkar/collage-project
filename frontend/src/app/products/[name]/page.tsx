'use client'
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Custom/common/Navebar';
import Footer from '@/components/Custom/common/Footer';
import SearchBar from '@/components/Custom/common/SearchBar';

export default function ProductsPage() {
  const params = useParams();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`http://localhost:9090/api/autocomplete?prefix=${encodeURIComponent(params.name as string)}&limit=50`);
        const data = await response.json();
        const sameNameProducts = (data.items || []).filter((item: any) => 
          item.name.toLowerCase() === (params.name as string).toLowerCase()
        );
        setProducts(sameNameProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.name) {
      fetchProducts();
    }
  }, [params.name]);

  if (loading) {
    return (
      <>
        <div className="relative z-50">
          <Navbar />
        </div>
        <div className="min-h-screen bg-[#242423] text-white flex items-center justify-center">
          Loading...
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="relative z-50">
        <Navbar />
      </div>
      <div className="min-h-[25vh] pt-6 relative z-40 border-b-[1px] border-white bg-[#242423]">
        <SearchBar />
      </div>
      <div className="min-h-screen bg-[#242423] text-white">
        <div className="container mx-auto px-8 py-12">
          <div className="mb-12">
            <button 
              onClick={() => router.back()}
              className="text-[#FF90E8] hover:text-white mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FF90E8] to-white bg-clip-text text-transparent">
              {params.name}
            </h1>
            <p className="text-gray-400 mt-2">{products.length} products found</p>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => router.push(`/product/${product.category}/${product.id}`)}
                className="group bg-black/50 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer 
                         border border-gray-700 hover:border-[#FF90E8] transition-all duration-300
                         hover:shadow-2xl hover:shadow-[#FF90E8]/20 hover:-translate-y-2"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 p-2 bg-[#FFA541] rounded group-hover:text-white transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                    Premium quality {product.category} with excellent craftsmanship and modern design.
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-black bg-[#22C55E] px-3 py-1 rounded">
                      ₹1,299
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1 bg-yellow-500 text-center rounded-md text-black font-semibold">
                      {product.category}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="px-3 py-1 bg-orange-500 text-center rounded-md text-black font-semibold">{product.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}