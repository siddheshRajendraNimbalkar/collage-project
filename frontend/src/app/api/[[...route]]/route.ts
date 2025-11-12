import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Call backend API for advanced search
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9090';
    const response = await fetch(`${backendUrl}/v1/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: query }),
    });
    
    if (!response.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await response.json();
    const results = data.products?.map((product: any) => ({
      id: product.id,
      name: product.name,
      image: product.product_url || '/placeholder.jpg'
    })) || [];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}