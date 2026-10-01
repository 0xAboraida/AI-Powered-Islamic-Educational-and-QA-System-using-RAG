export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    })
  }

  const url = new URL(req.url)

  // Extract path: either after /api/turath-proxy or from __path/endpoint query param
  let endpoint = url.pathname.replace(/^\/api\/turath-proxy/, '')
  if (!endpoint || endpoint === '/') {
    const pathParam = url.searchParams.get('__path') || url.searchParams.get('endpoint')
    if (pathParam) {
      endpoint = pathParam.startsWith('/') ? pathParam : `/${pathParam}`
      url.searchParams.delete('__path')
      url.searchParams.delete('endpoint')
    }
  }

  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`
  }

  const query = url.search
  const targetUrl = `https://api.turath.io${endpoint}${query}`

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      },
    })

    const body = await response.text()
    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
