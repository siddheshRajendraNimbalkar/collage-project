export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get('prefix') || ''
    const limit = searchParams.get('limit') || '10'

    if (!prefix.trim()) {
      return Response.json({ query: prefix, items: [] })
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9090'
    const response = await fetch(
      `${backendUrl}/api/autocomplete?prefix=${encodeURIComponent(prefix)}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error('Autocomplete API error:', error)
    return Response.json(
      { query: '', items: [], error: 'Search failed' },
      { status: 500 }
    )
  }
}