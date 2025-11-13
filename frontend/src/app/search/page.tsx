'use client'
import { useSearchParams } from 'next/navigation'
import SearchBar from '@/components/SearchBar'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('query') || ''

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <SearchBar 
            placeholder="Search products, posts, or anything..."
            className="mb-6"
          />
        </div>

        {query && (
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Search Results for "{query}"
            </h1>
            <p className="text-gray-600">
              Search functionality is ready! Integrate with your backend to show actual results.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}