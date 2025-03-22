'use client'

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';

interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  product_url?: string;
  category: string;
  dominantColor?: string;
}

interface GroupedCartItem {
  product_id: string;
  items: CartItem[];
}

interface ProductsMap {
  [key: string]: Product;
}

const categoryBgColors: { [key: string]: string } = {
  art: "#FAF3E0",
  poster: "#F6E6E6",
  design: "#E9F3F7",
  tech: "#F0E8F6",
  photography: "#FDE8E9",
  fashion: "#EBF4ED",
};

const getTextColor = (bgColor: string): string => {
  if (!bgColor) return 'text-gray-800';
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 125 ? 'text-gray-800' : 'text-white';
};  

const CardPage: React.FC = () => {
  const [error, setError] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<ProductsMap>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const response = await axios.post<{ items?: CartItem[] }>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/api/userCart`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.items) {
          setCartItems(response.data.items);
          if (response.data.items.length > 0) {
            await fetchProductDetails(response.data.items, token);
          }
        }
      } catch (error) {
        setError('Failed to load cart items');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const fetchProductDetails = async (items: CartItem[], token: string) => {
    const productIds = [...new Set(items.map(item => item.product_id))];
    const productsMap: ProductsMap = {};

    try {
      await Promise.all(productIds.map(async (id) => {
        const response = await axios.post<{ product: Product }>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/api/productOnlyId`,
          { id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        productsMap[id] = response.data.product;
      }));
      
      setProducts(productsMap);
    } catch (error) {
      setError('Failed to load product details');
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/v1/api/removeCart`,
        { id:cartItemId },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
        )
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
    } catch (error) {
      setError('Failed to remove item');
    }
  };

  const groupedItems = cartItems.reduce((acc: Record<string, GroupedCartItem>, item) => {
    if (!acc[item.product_id]) {
      acc[item.product_id] = { product_id: item.product_id, items: [] };
    }
    acc[item.product_id].items.push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Shopping Cart</h1>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4 text-gray-600">
            Your cart is empty
          </h2>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {Object.values(groupedItems).map((group) => {
            const product = products[group.product_id];
            if (!product) return null;

            const bgColor = product.dominantColor || categoryBgColors[product.category] || "#FFFFFF";
            const textColor = getTextColor(bgColor);

            return (
              <div
                key={group.product_id}
                className="flex cursor-pointer items-start p-6 rounded-xl shadow-sm transition-all hover:shadow-md"
                style={{ backgroundColor: bgColor }}
                onClick={()=>{
                  router.push(`/product/${product.category}/${product.id}`)
                }}
              >
                <div className="w-32 h-32 mr-6 bg-white rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                {product.product_url ? (
                    <Image
                      src={product.product_url}
                      alt={product.name}
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-xl font-semibold ${textColor}`}>
                      {product.name}
                    </h3>
                    <button
                      onClick={() => removeItem(group.items[0].id)}
                      className={`text-sm px-3 py-1 rounded-lg transition-opacity hover:bg-red-400 ${
                        textColor === 'text-white' 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Remove
                    </button>
                  </div>

                  <p className={`text-sm mb-2 ${textColor} opacity-90`}>
                    {product.category}
                  </p>

                  {product.description && (
                    <p className={`text-sm mb-4 ${textColor} opacity-80 line-clamp-2`}>
                      {product.description}
                    </p>
                  )}

                  <div className={`flex justify-between items-center ${textColor}`}>
                    <span className="text-lg font-medium">
                    ₹{product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CardPage;