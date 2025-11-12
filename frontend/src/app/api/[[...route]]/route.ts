import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 1) {
      return NextResponse.json({ items: [] });
    }

    // Call backend autocomplete API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9090';
    const response = await fetch(`${backendUrl}/v1/autocomplete?query=${encodeURIComponent(query)}&limit=8`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({ items: [] });
    }

    const data = await response.json();
    return NextResponse.json({ items: data.items || [] });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json({ items: [] });
  }
}