// Utility to parse product format strings like '2L', '500g', '750 ml', '1.5kg'
// Returns { quantity: number|null, unit: string|null, canonicalQty: number|null, canonicalUnit: 'ml'|'g'|'unit' }

const UNIT_MAP = {
  l: { canonical: 'ml', factor: 1000 },
  ml: { canonical: 'ml', factor: 1 },
  cl: { canonical: 'ml', factor: 10 },
  kg: { canonical: 'g', factor: 1000 },
  g: { canonical: 'g', factor: 1 },
  mg: { canonical: 'g', factor: 0.001 },
  oz: { canonical: 'g', factor: 28.3495 },
  lb: { canonical: 'g', factor: 453.592 }
}

export function parseFormat(format){
  if(!format) return { quantity: null, unit: null, canonicalQty: null, canonicalUnit: 'unit' }
  const text = String(format).trim().toLowerCase().replace(/,/g,'.')
  // Try patterns with number + unit
  const m = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(kg|g|mg|lb|oz|l|ml|cl)/)
  if(!m){
    // Could be like '2 x 200g'
    const multi = text.match(/([0-9]+)\s*x\s*([0-9]+(?:\.[0-9]+)?)(kg|g|mg|lb|oz|l|ml|cl)/)
    if(multi){
      const count = Number(multi[1])
      const qty = Number(multi[2])
      const unit = multi[3]
      const map = UNIT_MAP[unit]
      if(map){
        const canonicalQty = count * qty * map.factor
        return { quantity: count * qty, unit, canonicalQty, canonicalUnit: map.canonical }
      }
    }
    return { quantity: null, unit: null, canonicalQty: null, canonicalUnit: 'unit' }
  }
  const qty = Number(m[1])
  const unit = m[2]
  const map = UNIT_MAP[unit]
  if(!map){
    return { quantity: qty, unit, canonicalQty: qty, canonicalUnit: unit }
  }
  return { quantity: qty, unit, canonicalQty: qty * map.factor, canonicalUnit: map.canonical }
}

export function formatUnitQuantity(canonicalQty, canonicalUnit){
  if(canonicalQty == null) return ''
  if(canonicalUnit === 'ml'){
    // Show L if >=1000 ml
    if(canonicalQty >= 1000) return (canonicalQty/1000).toFixed(2).replace(/\.00$/, '') + ' L'
    return canonicalQty + ' ml'
  }
  if(canonicalUnit === 'g'){
    if(canonicalQty >= 1000) return (canonicalQty/1000).toFixed(2).replace(/\.00$/, '') + ' kg'
    return canonicalQty + ' g'
  }
  return canonicalQty + ' u'
}

export function computeUnitPrice(price, canonicalQty, canonicalUnit){
  if(price == null || canonicalQty == null || canonicalQty === 0) return null
  // normalized to per canonical unit base (ml or g)
  const per = price / canonicalQty
  return { per, canonicalUnit }
}
