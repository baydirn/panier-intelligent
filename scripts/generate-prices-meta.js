// Generate prices-meta.json summarizing the enriched dataset
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadPrices(){
  const file = path.join(__dirname, '..', 'public', 'prices.initial.json')
  if(!fs.existsSync(file)) throw new Error('prices.initial.json not found, run generate-initial-prices first')
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function buildMeta(data){
  const items = Array.isArray(data.items) ? data.items : []
  const perStore = {}
  items.forEach(it => { perStore[it.store] = (perStore[it.store]||0) + 1 })
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalItems: items.length,
    totalSources: Object.keys(perStore).length,
    perStore: Object.entries(perStore).map(([store, count]) => ({ store, count }))
  }
}

function main(){
  const data = loadPrices()
  const meta = buildMeta(data)
  const outFile = path.join(__dirname, '..', 'public', 'prices-meta.json')
  fs.writeFileSync(outFile, JSON.stringify(meta, null, 2), 'utf8')
  console.log(`Wrote meta: ${meta.totalItems} items across ${meta.totalSources} stores -> ${outFile}`)
}

if(import.meta.url === `file://${process.argv[1]}`){
  main()
}
