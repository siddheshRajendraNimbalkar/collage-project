'use client'

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';

interface OrderItem {
  id: string;
  user_id: string;
  product_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  total_price: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  product_url?: string;
  category: string;
  stock: number;
}

interface ProductsMap {
  [key: string]: Product;
}

const statusColors = {
  pending: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-200"
  },
  completed: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200"
  },
  cancelled: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200"
  }
};

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

const SellProductPage: React.FC = () => {
  const [error, setError] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<ProductsMap>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const response = await axios.post<{ orders?: OrderItem[] }>(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/api/orderList`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.orders) {
          setOrderItems(response.data.orders);
          if (response.data.orders.length > 0) {
            await fetchProductDetails(response.data.orders, token);
          }
        }
      } catch (error) {
        setError('Failed to load order items');
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, [router]);

  const fetchProductDetails = async (items: OrderItem[], token: string) => {
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



  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Orders</h1>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : orderItems.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4 text-gray-600">
            You don't have any orders yet
          </h2>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {orderItems.map((order) => {
            const product = products[order.product_id];
            if (!product) return null;

            const bgColor = categoryBgColors[product.category] || "#FFFFFF";
            const textColor = getTextColor(bgColor);

            return (
              <div
                key={order.id}
                className="p-6 rounded-xl shadow-sm transition-all hover:shadow-md"
                style={{ backgroundColor: bgColor }}
                onClick={() => {
                  router.push(`/users/orders/${product.id}`)
                }}
              >
                <div className="flex items-start cursor-pointer">
                  <div className="w-32 h-32 mr-6 bg-white rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                    {product.product_url ? (
                      <Image
                        src={product.product_url}
                        alt={product.name}
                        width={128}
                        height={128}
                        className="object-cover w-full h-full cursor-pointer"
                        onClick={() => router.push(`/product/${product.category}/${product.id}`)}
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
                      <div className="flex items-center space-x-2">
                        {
                          <span className={`px-2 py-1 text-xs font-medium rounded bg-gray-100 ${textColor}`}>
                            Stock: {product.stock}
                          </span>
                      }
                        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[order.status].bg} ${statusColors[order.status].text}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
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
                      <div className="flex items-center">
                        <span className="text-lg font-medium">
                          ₹{parseFloat(order.total_price).toFixed(2)}
                        </span>
                        
                       
                      </div>
                      
                      
                    </div>
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

export default SellProductPage;