'use client'

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { Package2, AlertCircle, Loader2, RefreshCcw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredProducts(
        products.filter((product: any) =>
          product.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      handleError("Authentication required. Please login to view products.");
      return;
    }

    try {
      setIsLoading(true);
      setIsRefreshing(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/api/productByUser`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.message) {
        handleError(response.data.message);
      } else {
        const fetchedProducts = response.data.products || [];
        setProducts(fetchedProducts);

        // Maintain search filtering even after fetching new products
        setFilteredProducts(
          searchQuery.trim()
            ? fetchedProducts.filter((product: any) =>
                product.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
              )
            : fetchedProducts
        );
      }
    } catch (error: any) {
      handleError(error.response?.data?.message || "Failed to fetch products");
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleError = (message: any) => {
    setError(message);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-white shadow-lg">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-gray-600 font-medium">Loading your products...</p>
          <p className="text-gray-400 text-sm">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-6 md:mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Package2 className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Your Products</h1>
                <p className="text-gray-500 mt-1">Manage and monitor your product inventory</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 bg-gray-50 border-gray-200 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={fetchProducts}
                variant="outline"
                className="hover:bg-blue-50 border-gray-200"
                disabled={isRefreshing}
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Alert className="bg-white border-yellow-200 shadow-sm">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              No products found. Add some products to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredProducts.map((product: any, index: number) => (
              <Card
              key={product.id}
              className="bg-white border cursor-pointer border-gray-100 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300"
              style={{
                animationName: 'fadeInUp',
                animationDuration: '0.5s',
                animationTimingFunction: 'ease',
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'forwards',
              }}
              onClick={()=>{
                router.push(`/selling/product/${product.id}`)
              }}
            >
                <CardHeader className="pb-2" >
                  <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                  <span className="text-gray-500 text-sm">{product.type}</span>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="relative h-48 sm:h-52 overflow-hidden bg-gray-100 rounded-2xl">
                    <Image
                      src={product.product_url}
                      alt={product.name}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 rounded-2xl"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
                    <span className="text-black font-bold text-base sm:text-lg truncate">
                      ₹{product.price.toFixed(2)}
                    </span>
                    <span className="px-2 sm:px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs sm:text-sm font-medium border border-blue-100 truncate max-w-20 sm:max-w-none">
                      {product.category}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
          </div>
        )}

        {/* Error Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
                Error Occurred
              </DialogTitle>
            </DialogHeader>
            <div className="bg-white p-4 rounded-lg border ">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsDialogOpen(false)} className="bg-red-500 hover:bg-red-600 text-white">
                Dismiss
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProductPage;
