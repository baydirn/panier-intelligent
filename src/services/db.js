// services/db.js
// Browser-friendly storage using localforage.
// This replaces the native `better-sqlite3` implementation for prototyping in the browser.

import localforage from 'localforage'
import { nanoid } from 'nanoid'

const STORE_KEY = 'panier_products_v1'
const RECURR_KEY = 'panier_recurrent_products_v1'
const PROGRESS_PREFIX = 'panier_progress_v1_'
// lightweight learning keys
const SESSION_INDEX_KEY = 'panier_session_index_v1'
const PRODUCT_STATS_KEY = 'panier_product_stats_v1' // name -> { consecutive, lastIndex }
const SUGGEST_IGNORE_KEY = 'panier_suggest_ignore_v1' // [names]
// saved lists management
const SAVED_LISTS_KEY = 'panier_saved_lists_v1' // array of {id, name, createdAt, products[]}
const CURRENT_LIST_ID_KEY = 'panier_current_list_id_v1' // string | null
// prix & alertes
const PRICE_HISTORY_KEY = 'panier_price_history_v1' // name -> [{date, store, price}]
const PRICE_ALERTS_KEY = 'panier_price_alerts_v1' // name -> { targetPrice }

localforage.config({ name: 'PanierIntelligent' })

async function init(){
  const existing = await localforage.getItem(STORE_KEY)
  if(!existing) await localforage.setItem(STORE_KEY, [])
  const rec = await localforage.getItem(RECURR_KEY)
  if(!rec) await localforage.setItem(RECURR_KEY, [])
  if((await localforage.getItem(SESSION_INDEX_KEY)) == null){ await localforage.setItem(SESSION_INDEX_KEY, 0) }
  if(!(await localforage.getItem(PRODUCT_STATS_KEY))){ await localforage.setItem(PRODUCT_STATS_KEY, {}) }
  if(!(await localforage.getItem(SUGGEST_IGNORE_KEY))){ await localforage.setItem(SUGGEST_IGNORE_KEY, []) }
  if(!(await localforage.getItem(SAVED_LISTS_KEY))){ await localforage.setItem(SAVED_LISTS_KEY, []) }
  if(!(await localforage.getItem(PRICE_HISTORY_KEY))){ await localforage.setItem(PRICE_HISTORY_KEY, {}) }
  if(!(await localforage.getItem(PRICE_ALERTS_KEY))){ await localforage.setItem(PRICE_ALERTS_KEY, {}) }
}

async function getAllProducts(){
  const list = await localforage.getItem(STORE_KEY)
  return (list || []).slice().reverse()
}

async function getProductById(id){
  const list = await localforage.getItem(STORE_KEY) || []
  return list.find(p => p.id === id) || null
}

async function addProduct(product){
  const list = await localforage.getItem(STORE_KEY) || []
  const p = { id: nanoid(), nom: product.nom, quantite: product.quantite ?? 1, recurrent: !!product.recurrent, magasin: product.magasin || null, prix: product.prix ?? null, purchased: !!product.purchased }
  list.push(p)
  await localforage.setItem(STORE_KEY, list)
  return p
}

async function updateProduct(id, fields){
  const list = await localforage.getItem(STORE_KEY) || []
  const idx = list.findIndex(p => p.id === id)
  if(idx === -1) return null
  list[idx] = { ...list[idx], ...fields }
  await localforage.setItem(STORE_KEY, list)
  return list[idx]
}

async function deleteProduct(id){
  let list = await localforage.getItem(STORE_KEY) || []
  const before = list.length
  list = list.filter(p => p.id !== id)
  await localforage.setItem(STORE_KEY, list)
  return { deleted: before - list.length }
}

// --- Recurrent products CRUD ---
async function getRecurrentProducts(){
  const list = await localforage.getItem(RECURR_KEY)
  return (list || []).slice()
}

async function addRecurrentProduct(p){
  const list = await localforage.getItem(RECURR_KEY) || []
  // prevent duplicates by name (case-insensitive)
  const name = (p.name || p.nom || '').trim()
  if(!name) throw new Error('name required')
  const exists = list.find(x => (x.name || '').toLowerCase() === name.toLowerCase())
  if(exists) return exists
  const rec = {
    id: nanoid(),
    name,
    default_quantity: p.default_quantity ?? p.quantite ?? 1,
    default_store: p.default_store ?? p.magasin ?? null,
    active: p.active != null ? !!p.active : true
  }
  list.push(rec)
  await localforage.setItem(RECURR_KEY, list)
  return rec
}

async function updateRecurrentProduct(id, fields){
  const list = await localforage.getItem(RECURR_KEY) || []
  const idx = list.findIndex(r => r.id === id)
  if(idx === -1) return null
  const updated = { ...list[idx], ...fields }
  list[idx] = updated
  await localforage.setItem(RECURR_KEY, list)
  return updated
}

async function deleteRecurrentProduct(id){
  let list = await localforage.getItem(RECURR_KEY) || []
  const before = list.length
  list = list.filter(r => r.id !== id)
  await localforage.setItem(RECURR_KEY, list)
  return { deleted: before - list.length }
}

async function toggleRecurrentProduct(id, active){
  return updateRecurrentProduct(id, { active: !!active })
}

// --- Shopping progress persistence ---
// Save a set/array of checked product ids for a given listId
async function saveProgress(listId, checkedItems){
  if(!listId) return
  const key = PROGRESS_PREFIX + String(listId)
  // Normalize to unique array of ids
  const unique = Array.from(new Set((checkedItems || []).map(String)))
  await localforage.setItem(key, unique)
  return unique
}

async function loadProgress(listId){
  if(!listId) return []
  const key = PROGRESS_PREFIX + String(listId)
  const data = await localforage.getItem(key)
  return Array.isArray(data) ? data : []
}

async function clearProgress(listId){
  if(!listId) return
  const key = PROGRESS_PREFIX + String(listId)
  await localforage.removeItem(key)
}

// --- Lightweight learning for recurrent suggestions ---
async function startNewListSession(){
  let idx = await localforage.getItem(SESSION_INDEX_KEY)
  if(typeof idx !== 'number') idx = 0
  idx += 1
  await localforage.setItem(SESSION_INDEX_KEY, idx)
  return idx
}

async function getCurrentSessionIndex(){
  let idx = await localforage.getItem(SESSION_INDEX_KEY)
  return typeof idx === 'number' ? idx : 0
}

async function recordOccurrencesForCurrentList(productNames){
  const idx = await getCurrentSessionIndex()
  const stats = (await localforage.getItem(PRODUCT_STATS_KEY)) || {}
  const unique = Array.from(new Set((productNames || []).map(n => String(n || '').trim()).filter(Boolean)))
  for(const name of unique){
    const entry = stats[name] || { consecutive: 0, lastIndex: 0 }
    if(entry.lastIndex === idx - 1){ entry.consecutive += 1 } else { entry.consecutive = 1 }
    entry.lastIndex = idx
    stats[name] = entry
  }
  await localforage.setItem(PRODUCT_STATS_KEY, stats)
  return stats
}

async function detectRecurrentCandidates(){
  const stats = (await localforage.getItem(PRODUCT_STATS_KEY)) || {}
  const ignore = (await localforage.getItem(SUGGEST_IGNORE_KEY)) || []
  const recurr = (await localforage.getItem(RECURR_KEY)) || []
  const existing = new Set(recurr.map(r => (r.name || '').toLowerCase()))
  const ignored = new Set(ignore.map(n => String(n).toLowerCase()))
  const out = []
  for(const [name, s] of Object.entries(stats)){
    if(s.consecutive >= 3){
      const key = name.toLowerCase()
      if(!existing.has(key) && !ignored.has(key)) out.push({ name, score: s.consecutive })
    }
  }
  // sort by score desc
  out.sort((a,b)=> b.score - a.score)
  return out
}

async function ignoreRecurrentSuggestion(name){
  const list = (await localforage.getItem(SUGGEST_IGNORE_KEY)) || []
  const key = String(name || '').toLowerCase()
  if(!key) return list
  if(!list.find(x => String(x).toLowerCase() === key)) list.push(name)
  await localforage.setItem(SUGGEST_IGNORE_KEY, list)
  return list
}

async function clearRecurrentLearning(){
  await localforage.setItem(PRODUCT_STATS_KEY, {})
  await localforage.setItem(SUGGEST_IGNORE_KEY, [])
}

// --- Saved Lists Management ---
async function getSavedLists(){
  const lists = await localforage.getItem(SAVED_LISTS_KEY)
  return Array.isArray(lists) ? lists : []
}

async function createSavedList(name){
  const lists = await getSavedLists()
  const currentProducts = await localforage.getItem(STORE_KEY) || []
  const newList = {
    id: nanoid(),
    name: name || `Liste ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    products: currentProducts.map(p => ({...p})) // clone products
  }
  lists.push(newList)
  await localforage.setItem(SAVED_LISTS_KEY, lists)
  return newList
}

async function updateSavedList(id, updates){
  const lists = await getSavedLists()
  const idx = lists.findIndex(l => l.id === id)
  if(idx === -1) return null
  lists[idx] = { ...lists[idx], ...updates }
  await localforage.setItem(SAVED_LISTS_KEY, lists)
  return lists[idx]
}

async function deleteSavedList(id){
  let lists = await getSavedLists()
  const before = lists.length
  lists = lists.filter(l => l.id !== id)
  await localforage.setItem(SAVED_LISTS_KEY, lists)
  // if current list was deleted, clear it
  const currentId = await localforage.getItem(CURRENT_LIST_ID_KEY)
  if(currentId === id){
    await localforage.setItem(CURRENT_LIST_ID_KEY, null)
  }
  return { deleted: before - lists.length }
}

async function loadSavedList(id){
  const lists = await getSavedLists()
  const list = lists.find(l => l.id === id)
  if(!list) return null
  
  // Replace current products with saved list products
  await localforage.setItem(STORE_KEY, list.products.map(p => ({...p})))
  await localforage.setItem(CURRENT_LIST_ID_KEY, id)
  
  return list
}

async function getCurrentListId(){
  return await localforage.getItem(CURRENT_LIST_ID_KEY)
}

async function saveCurrentListAs(name){
  const currentId = await getCurrentListId()
  const currentProducts = await localforage.getItem(STORE_KEY) || []
  
  if(currentId){
    // Update existing saved list
    const updated = await updateSavedList(currentId, {
      name: name || undefined,
      products: currentProducts.map(p => ({...p}))
    })
    return updated
  } else {
    // Create new saved list
    return await createSavedList(name)
  }
}

async function clearCurrentList(){
  await localforage.setItem(STORE_KEY, [])
  await localforage.setItem(CURRENT_LIST_ID_KEY, null)
}

// --- Price history & alerts ---
async function recordPriceObservation(name, store, price){
  const key = String(name || '').trim()
  if(!key || price == null) return null
  const map = (await localforage.getItem(PRICE_HISTORY_KEY)) || {}
  const arr = map[key] || []
  arr.push({ date: new Date().toISOString(), store, price: Number(price) })
  // garder seulement les 50 dernières observations
  map[key] = arr.slice(-50)
  await localforage.setItem(PRICE_HISTORY_KEY, map)
  return map[key]
}

async function getPriceHistory(name){
  const key = String(name || '').trim()
  const map = (await localforage.getItem(PRICE_HISTORY_KEY)) || {}
  return map[key] || []
}

async function getLatestPrice(name){
  const hist = await getPriceHistory(name)
  return hist.length ? hist[hist.length - 1] : null
}

async function setPriceAlert(name, targetPrice){
  const key = String(name || '').trim()
  const alerts = (await localforage.getItem(PRICE_ALERTS_KEY)) || {}
  if(targetPrice == null){
    delete alerts[key]
  } else {
    alerts[key] = { targetPrice: Number(targetPrice) }
  }
  await localforage.setItem(PRICE_ALERTS_KEY, alerts)
  return alerts[key] || null
}

async function getPriceAlert(name){
  const key = String(name || '').trim()
  const alerts = (await localforage.getItem(PRICE_ALERTS_KEY)) || {}
  return alerts[key] || null
}

// initialize immediately
init().catch(()=>{})

export {
  init,
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  // recurrent
  getRecurrentProducts,
  addRecurrentProduct,
  updateRecurrentProduct,
  deleteRecurrentProduct,
  toggleRecurrentProduct,
  saveProgress,
  loadProgress,
  clearProgress,
  // learning
  startNewListSession,
  getCurrentSessionIndex,
  recordOccurrencesForCurrentList,
  detectRecurrentCandidates,
  ignoreRecurrentSuggestion,
  clearRecurrentLearning,
  // saved lists management
  getSavedLists,
  createSavedList,
  updateSavedList,
  deleteSavedList,
  loadSavedList,
  getCurrentListId,
  saveCurrentListAs,
  clearCurrentList,
  // prices
  recordPriceObservation,
  getPriceHistory,
  getLatestPrice,
  setPriceAlert,
  getPriceAlert
}
