'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader } from './ui/loader'

interface Suggestion {
  id: string
  title: string
}

interface SearchBarProps {
  placeholder?: string
  className?: string
}

export default function SearchBar({ 
  placeholder = "Search...", 
  className = "" 
}: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLUListElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (abortRef.current) {
      abortRef.current.abort()
    }

    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const controller = new AbortController()
    abortRef.current = controller

    const fetchSuggestions = async () => {
      console.log('🔍 Fetching suggestions for query:', query)
      setLoading(true)
      try {
        const url = `http://localhost:9090/api/autocomplete?prefix=${encodeURIComponent(query)}&limit=5`
        console.log('📡 API URL:', url)
        const response = await fetch(
          url,
          { 
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
        console.log('📥 Response status:', response.status)
        
        if (!response.ok) {
          console.error(`❌ Search failed: ${response.status} ${response.statusText}`)
          setSuggestions([])
          setShowSuggestions(false)
          return
        }
        
        const data = await response.json()
        console.log('📊 Response data:', data)
        console.log('📄 Items found:', data.items?.length || 0)
        setSuggestions(data.items || [])
        setHasMore((data.items || []).length === 5)
        setOffset(5)
        setShowSuggestions(true)
        setSelectedIndex(-1)
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('⚠️ Search error:', error)
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          })
          setSuggestions([])
          setShowSuggestions(false)
        }
      } finally {
        console.log('✅ Search completed, loading:', false)
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchSuggestions, 300)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query])

  const loadMoreSuggestions = async () => {
    if (!hasMore || loading) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `http://localhost:9090/api/autocomplete?prefix=${encodeURIComponent(query)}&limit=5&offset=${offset}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (!response.ok) {
        console.error('Failed to load more suggestions:', response.status)
        return
      }
      
      const data = await response.json()
      const newItems = data.items || []
      
      setSuggestions(prev => [...prev, ...newItems])
      setHasMore(newItems.length === 5)
      setOffset(prev => prev + 5)
    } catch (error) {
      console.error('Error loading more suggestions:', error)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 10 && hasMore) {
      loadMoreSuggestions()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex])
        } else if (query.trim()) {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.title)
    setShowSuggestions(false)
    router.push(`/search?query=${encodeURIComponent(suggestion.title)}`)
  }

  const handleSearch = () => {
    if (query.trim()) {
      setShowSuggestions(false)
      router.push(`/search?query=${encodeURIComponent(query)}`)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  return (
    <div className={`relative w-full max-w-2xl ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 pr-4 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <Loader size="sm" />
          </div>
        )}
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <ul
          ref={suggestionsRef}
          onScroll={handleScroll}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              onMouseDown={() => handleSelect(suggestion)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex 
                  ? 'bg-blue-50 text-blue-900' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm font-medium">{suggestion.title}</span>
              </div>
            </li>
          ))}
          {hasMore && (
            <li className="px-4 py-2 text-center text-gray-500 text-sm">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader size="sm" />
                  Loading more...
                </div>
              ) : (
                'Scroll for more'
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}