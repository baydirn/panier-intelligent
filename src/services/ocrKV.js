// Simple KV-like storage for OCR submissions using localforage
import localforage from 'localforage'

const OCR_SUBMISSIONS_KEY = 'ocr_submissions_v1' // array of {id, store, period:{from,to}, products, imageUrl, uploadedBy, status, createdAt}

function toDate(d){
  if(!d) return null
  const x = new Date(d)
  return isNaN(x.getTime()) ? null : x
}

export async function listSubmissions(){
  return (await localforage.getItem(OCR_SUBMISSIONS_KEY)) || []
}

export function periodsOverlap(aFrom, aTo, bFrom, bTo){
  const aF = toDate(aFrom), aT = toDate(aTo), bF = toDate(bFrom), bT = toDate(bTo)
  if(!aF || !aT || !bF || !bT) return false
  return aF <= bT && bF <= aT
}

export async function hasSubmissionFor(store, from, to){
  const list = (await localforage.getItem(OCR_SUBMISSIONS_KEY)) || []
  const keyStore = String(store || '').trim().toLowerCase()
  return list.some(s => String(s.store||'').toLowerCase() === keyStore && periodsOverlap(s.period?.from, s.period?.to, from, to))
}

export async function saveSubmission(entry){
  const list = (await localforage.getItem(OCR_SUBMISSIONS_KEY)) || []
  const id = entry.id || `${Date.now()}_${Math.random().toString(36).slice(2,8)}`
  const payload = { id, createdAt: new Date().toISOString(), status: 'pending_review', ...entry }
  list.push(payload)
  await localforage.setItem(OCR_SUBMISSIONS_KEY, list)
  return payload
}

export async function removeSubmission(id){
  let list = (await localforage.getItem(OCR_SUBMISSIONS_KEY)) || []
  list = list.filter(s => s.id !== id)
  await localforage.setItem(OCR_SUBMISSIONS_KEY, list)
  return true
}
