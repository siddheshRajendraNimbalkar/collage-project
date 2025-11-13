'use client'
import { useState } from 'react'
import { 
  Loader, 
  Skeleton, 
  SkeletonCard, 
  SkeletonText, 
  SkeletonButton,
  ProductGridSkeleton,
  ProductCardSkeleton,
  ProductListSkeleton,
  PageLoader,
  FullPageLoader
} from '@/components/ui'
import { Button } from '@/components/ui/button'

export default function LoaderExamples() {
  const [showFullPageLoader, setShowFullPageLoader] = useState(false)
  const [loading, setLoading] = useState(false)

  const simulateLoading = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Loader & Skeleton Examples</h1>
      
      {/* Loaders */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loaders</h2>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <Loader size="sm" />
            <p className="text-sm mt-2">Small</p>
          </div>
          <div className="text-center">
            <Loader size="md" />
            <p className="text-sm mt-2">Medium</p>
          </div>
          <div className="text-center">
            <Loader size="lg" />
            <p className="text-sm mt-2">Large</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Loader variant="spinner" />
          <Loader variant="dots" />
          <Loader variant="pulse" />
        </div>
      </section>

      {/* Skeletons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Skeletons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Basic Skeleton</h3>
            <Skeleton className="h-4 w-full" />
          </div>
          <div>
            <h3 className="font-medium mb-2">Skeleton Text</h3>
            <SkeletonText lines={3} />
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Skeleton Card</h3>
          <div className="max-w-sm">
            <SkeletonCard />
          </div>
        </div>
      </section>

      {/* Product Skeletons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Product Skeletons</h2>
        <div>
          <h3 className="font-medium mb-2">Product Card</h3>
          <div className="max-w-sm">
            <ProductCardSkeleton />
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Product Grid (2 items)</h3>
          <ProductGridSkeleton count={2} />
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Product List</h3>
          <ProductListSkeleton count={3} />
        </div>
      </section>

      {/* Page Loaders */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Page Loaders</h2>
        <div className="border rounded-lg">
          <PageLoader message="Loading products..." />
        </div>
        
        <div className="flex gap-4">
          <Button onClick={() => setShowFullPageLoader(true)}>
            Show Full Page Loader
          </Button>
          <Button onClick={simulateLoading} disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader size="sm" />
                Loading...
              </div>
            ) : (
              'Simulate Loading'
            )}
          </Button>
        </div>
      </section>

      {showFullPageLoader && (
        <FullPageLoader message="Processing your request..." />
      )}
      
      {showFullPageLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <Button 
            onClick={() => setShowFullPageLoader(false)}
            className="mt-20"
          >
            Close Full Page Loader
          </Button>
        </div>
      )}
    </div>
  )
}