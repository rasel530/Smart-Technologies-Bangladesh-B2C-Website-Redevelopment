import { NextRequest, NextResponse } from 'next/server';

// Proxy all /api/v1/profile/* requests to backend
export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/profile/${path}`;

  // CORS diagnostic logging
  console.log('[Profile Proxy] PUT request:', {
    timestamp: new Date().toISOString(),
    path,
    backendUrl,
    'request-origin': request.headers.get('origin'),
    'request-referer': request.headers.get('referer'),
    'has-authorization': !!request.headers.get('authorization'),
    'content-type': request.headers.get('content-type'),
    'next-public-api-url': process.env.NEXT_PUBLIC_API_URL
  });

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

    // Log response diagnostics
    console.log('[Profile Proxy] Backend response:', {
      status: response.status,
      'content-type': response.headers.get('content-type'),
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
      'x-new-token': response.headers.get('x-new-token')
    });

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
