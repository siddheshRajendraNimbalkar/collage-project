import { Loader } from "./loader"

interface PageLoaderProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function PageLoader({ message = "Loading...", size = "lg" }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Loader size={size} />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  )
}

export function FullPageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader size="lg" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}