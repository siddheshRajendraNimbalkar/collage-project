import { cn } from "@/lib/utils"

interface LoaderProps {
  size?: "sm" | "md" | "lg"
  variant?: "spinner" | "dots" | "pulse"
  className?: string
}

export function Loader({ size = "md", variant = "spinner", className }: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  if (variant === "spinner") {
    return (
      <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-blue-600", sizeClasses[size], className)} />
    )
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex space-x-1", className)}>
        <div className={cn("rounded-full bg-blue-600 animate-bounce", sizeClasses[size])} style={{ animationDelay: "0ms" }} />
        <div className={cn("rounded-full bg-blue-600 animate-bounce", sizeClasses[size])} style={{ animationDelay: "150ms" }} />
        <div className={cn("rounded-full bg-blue-600 animate-bounce", sizeClasses[size])} style={{ animationDelay: "300ms" }} />
      </div>
    )
  }

  return (
    <div className={cn("animate-pulse bg-gray-300 rounded", sizeClasses[size], className)} />
  )
}