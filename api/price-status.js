export const config = {
  runtime: 'edge'
}

export default async function handler(req){
  try{
    const url = new URL(req.url)
    // Optional protection via secret for private deployments
    const secret = process.env.CRON_SECRET
    if(secret && url.searchParams.get('secret') !== secret){
      return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: cors() })
    }

    const metaDirect = process.env.PRICE_META_URL || ''
    const repo = process.env.GITHUB_REPO || ''
    const branch = process.env.GITHUB_BRANCH || 'main'
    const metaPath = process.env.GITHUB_META_PATH || 'prices-meta.json'
    const dataUrl = process.env.PRICE_DATA_URL || process.env.VITE_PRICE_DATA_URL || '/prices.json'

    // 1) Try explicit meta URL
    if(metaDirect){
      const m = await fetchJson(metaDirect)
      return new Response(JSON.stringify({ ok: true, source: 'meta-url', meta: m }), { status: 200, headers: cors() })
    }

    // 2) Try GitHub raw content if repo configured
    if(repo){
      const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${metaPath}`
      try{
        const m = await fetchJson(rawUrl)
        return new Response(JSON.stringify({ ok: true, source: 'github-meta', meta: m }), { status: 200, headers: cors() })
      }catch(_e){ /* fallthrough */ }
    }

    // 3) Fallback: build meta from prices.json
    try{
      const data = await fetchJson(dataUrl)
      const items = Array.isArray(data) ? data : (data.items || [])
      const generatedAt = (data.generatedAt) || new Date().toISOString()
      const meta = {
        version: 1,
        generatedAt,
        totalSources: data.sources || 1,
        totalItems: items.length,
        perSource: data.perSource || [],
        errors: data.errors || []
      }
      return new Response(JSON.stringify({ ok: true, source: 'prices-fallback', meta }), { status: 200, headers: cors() })
    }catch(e){
      return new Response(JSON.stringify({ ok: false, error: 'unavailable', details: String(e.message || e) }), { status: 200, headers: cors() })
    }
  }catch(err){
    return new Response(JSON.stringify({ ok: false, error: String(err.message || err) }), { status: 500, headers: cors() })
  }
}

function cors(){
  return { 'content-type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
}

async function fetchJson(url){
  const res = await fetch(url, { cache: 'no-cache' })
  if(!res.ok) throw new Error(`fetch ${url} -> ${res.status}`)
  const ct = res.headers.get('content-type') || ''
  if(ct.includes('application/json')){
    return await res.json()
  }
  const txt = await res.text()
  try { return JSON.parse(txt) } catch(_e){ throw new Error('invalid json at ' + url) }
}
