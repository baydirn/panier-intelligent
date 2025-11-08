export const config = {
  runtime: 'edge'
}

// Normalize items to { name, store, price, format?, updatedAt }
function normalizeItems(data){
  const items = Array.isArray(data) ? data : (data?.items || [])
  return items.map(it => ({
    name: String(it.name || it.product || '').trim().toLowerCase(),
    store: String(it.store || it.retailer || 'unknown').trim(),
    price: Number(it.price),
    format: it.format || it.size || null,
    updatedAt: it.updatedAt || new Date().toISOString().slice(0,10)
  })).filter(it => it.name && !Number.isNaN(it.price))
}

async function fetchFromUrl(url){
  const res = await fetch(url, { cache: 'no-cache' })
  if(!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`)
  const contentType = res.headers.get('content-type') || ''
  if(contentType.includes('application/json')){
    return normalizeItems(await res.json())
  }
  // Attempt to parse JSON inside text if served as text/plain
  const text = await res.text()
  try { return normalizeItems(JSON.parse(text)) } catch(_){}
  return []
}

async function putToGitHub({ repo, branch = 'main', path, token, content, message }){
  const apiBase = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`
  // Get current sha if exists
  let sha = undefined
  const headRes = await fetch(`${apiBase}?ref=${branch}`, { headers: { Authorization: `token ${token}`, 'User-Agent': 'panier-intelligent' }})
  if(headRes.ok){ const json = await headRes.json(); sha = json.sha }
  const body = {
    message: message || `chore(prices): weekly update ${new Date().toISOString().slice(0,10)}`,
    content: btoa(unescape(encodeURIComponent(content))),
    branch,
    sha
  }
  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'panier-intelligent' },
    body: JSON.stringify(body)
  })
  if(!putRes.ok){
    const t = await putRes.text()
    throw new Error(`GitHub PUT failed: ${putRes.status} ${t}`)
  }
  return await putRes.json()
}

export default async function handler(req){
  const url = new URL(req.url)
  const secret = process.env.CRON_SECRET
  // Optional protection: require ?secret=...
  if(secret && url.searchParams.get('secret') !== secret){
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: cors() })
  }

  const sourcesEnv = process.env.PRICE_SOURCE_URLS || ''
  const sources = sourcesEnv.split(',').map(s => s.trim()).filter(Boolean)
  const collected = []
  const errors = []
  for(const src of sources){
    try {
      const arr = await fetchFromUrl(src)
      collected.push(...arr)
    } catch(e){ errors.push({ src, error: String(e.message || e) }) }
  }
  // De-duplicate by name+store; keep lowest price
  const map = new Map()
  for(const it of collected){
    const key = `${it.name}__${it.store}`
    const prev = map.get(key)
    if(!prev || it.price < prev.price){ map.set(key, it) }
  }
  const items = Array.from(map.values())
  const payload = { version: 1, generatedAt: new Date().toISOString(), items }

  // Optional GitHub export
  const repo = process.env.GITHUB_REPO
  const token = process.env.GITHUB_TOKEN
  const path = process.env.GITHUB_PATH || 'prices.json'
  const branch = process.env.GITHUB_BRANCH || 'main'
  let publish = null
  if(repo && token){
    try {
      publish = await putToGitHub({ repo, branch, path, token, content: JSON.stringify(payload, null, 2) })
    } catch(e){ errors.push({ github: String(e.message || e) }) }
  }

  const body = { ok: true, items: items.length, sources: sources.length, errors, published: publish ? { repo, path, branch } : null }
  return new Response(JSON.stringify(body), { status: 200, headers: cors() })
}

function cors(){
  return { 'content-type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
}
