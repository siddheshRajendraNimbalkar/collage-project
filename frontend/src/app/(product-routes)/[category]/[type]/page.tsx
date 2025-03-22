'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'

const Page = () => {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const category = params.category || searchParams.get('category')
  const type = params.type || searchParams.get('type')

  const [data, setData] = useState<{ products: any[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!category || !type) return

    const fetchData = async () => {
      setLoading(true)
      
      
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/api/getProductType`,
          { category, type },
          { headers: { 'Content-Type': 'application/json' } }
        )
      
        setData(res.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [category, type])

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="p-4 mb-4 text-sm text-pink-500 border border-pink-500 rounded-lg text-center">
          Error: {error}
        </div>
      )}

      <div className="space-y-6">
        {data?.products?.map((product) => (
          <div
            key={product.id}
            className="relative cursor-pointer group flex border-4 rounded-xl bg-black p-4 transition-all duration-300 z-20 
            hover:-translate-x-2 hover:-translate-y-2 hover:shadow-[10px_10px_0px_rgba(255,255,255,1),_12px_12px_0px_rgba(255,255,255,0.1)]"
            onClick={() => router.push(`/product/${product.category}/${product.id}`)}
          >
            <div className="w-1/3 pr-4">
              <img
                src={product.product_url}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg border-2 border-pink-500"
              />
            </div>

            <div className="w-2/3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold mb-2 bg-green-500 px-4 text-zinc-900">
                    {product.name}
                  </h2>
                  <span className="px-3 py-1 bg-yellow-500 text-zinc-900 text-sm">
                    {product.type}
                  </span>
                </div>
                <p className="text-gray-400 bg-slate-400/10 text-sm mb-4 line-clamp-2">
                  {product.description}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xl font-bold bg-pink-500 px-4">${product.price}</p>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <p className="text-gray-500">Available Stock: {product.stock}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Page
