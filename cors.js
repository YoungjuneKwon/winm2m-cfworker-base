const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

const addCorsHeaders = r => {
  for (const k in corsHeaders) {
    r.headers.set(k, corsHeaders[k])
  }
  return r
}

export { addCorsHeaders }