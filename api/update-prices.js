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
  const perSourceStats = []
  for(const src of sources){
    try {
      const arr = await fetchFromUrl(src)
      collected.push(...arr)
      perSourceStats.push({ src, count: arr.length })
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
  const generatedAt = new Date().toISOString()
  const payload = { version: 1, generatedAt, items }

  // Build meta payload for UI & history tracking
  const hash = await sha256(JSON.stringify(items).slice(0,50000)) // quick hash (first part to cap size)
  const meta = {
    version: 1,
    generatedAt,
    totalSources: sources.length,
    totalItems: items.length,
    perSource: perSourceStats,
    errors,
    hash
  }

  // Optional GitHub export
  const repo = process.env.GITHUB_REPO
  const token = process.env.GITHUB_TOKEN
  const path = process.env.GITHUB_PATH || 'prices.json'
  const branch = process.env.GITHUB_BRANCH || 'main'
  const metaPath = process.env.GITHUB_META_PATH || 'prices-meta.json'
  const historyDir = process.env.GITHUB_HISTORY_DIR || '' // e.g. 'prices-history'
  let publish = null
  if(repo && token){
    try {
      publish = await putToGitHub({ repo, branch, path, token, content: JSON.stringify(payload, null, 2) })
      // Commit meta file
      await putToGitHub({ repo, branch, path: metaPath, token, content: JSON.stringify(meta, null, 2), message: `chore(prices): meta update ${generatedAt}` })
      // Optional historical snapshot (per week)
      if(historyDir){
        const d = new Date()
        const weekId = isoWeekId(d) // e.g. 2025-W45
        const histPath = `${historyDir}/${weekId}.json`
        await putToGitHub({ repo, branch, path: histPath, token, content: JSON.stringify(payload, null, 2), message: `chore(prices): weekly snapshot ${weekId}` })
      }
    } catch(e){ errors.push({ github: String(e.message || e) }) }
  }

  const body = { ok: true, items: items.length, sources: sources.length, errors, meta, published: publish ? { repo, path, metaPath, branch } : null }
  return new Response(JSON.stringify(body), { status: 200, headers: cors() })
}

function cors(){
  return { 'content-type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
}

// ISO week helper (YYYY-Www)
function isoWeekId(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Thursday in current week decides the year
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`
}

// Simple SHA-256 helper (browser/edge runtime has SubtleCrypto)
function sha256(str){
  try {
    const enc = new TextEncoder().encode(str)
    return crypto.subtle.digest('SHA-256', enc).then(buf => {
      const arr = Array.from(new Uint8Array(buf))
      return arr.map(b => b.toString(16).padStart(2,'0')).join('').slice(0,32)
    })
  } catch(e){ return 'hash-error' }
}
