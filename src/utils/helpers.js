export function formatPrice(p){
  if(p == null) return '—'
  return `${p.toFixed(2)} €`
}
