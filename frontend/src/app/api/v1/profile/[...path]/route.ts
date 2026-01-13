import { NextRequest, NextResponse } from 'next/server';

// Proxy all /api/v1/profile/* requests to backend
export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/profile/${path}`;

  try {
    // Get request body as text to preserve it
    const body = await request.text();
    const contentType = request.headers.get('content-type') || 'application/json';

    // Forward request to backend
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Authorization': request.headers.get('authorization') || '',
        'Cache-Control': request.headers.get('cache-control') || 'no-cache',
        'Pragma': request.headers.get('pragma') || 'no-cache',
      },
      body: body || undefined,
    });

    // Get response from backend
    const responseData = await response.text();

    // Return response with proper headers
    return new NextResponse(responseData, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma',
      },
    });
  } catch (error) {
    console.error('[Profile Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Proxy error', message: 'Failed to proxy request to backend' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma',
      'Access-Control-Max-Age': '86400',
    },
  });
}
