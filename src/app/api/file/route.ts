import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');

  if (!fileUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    // Proxy the request to Vercel Blob passing the read/write token to access private blobs
    const response = await fetch(fileUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      return new NextResponse(`Error fetching blob: ${response.statusText}`, { status: response.status });
    }

    // Return the file stream directly to the client
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        // Optional: Ensure it forces download or inline viewing
        // 'Content-Disposition': 'inline', 
      },
    });
  } catch (error: any) {
    console.error('Proxy Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
