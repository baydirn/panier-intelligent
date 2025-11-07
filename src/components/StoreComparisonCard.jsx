import React from 'react'

export default function StoreComparisonCard({combination}){
  const stores = (combination?.combo || []).join(' + ')
  return (
    <div className="border rounded p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-semibold">{stores || '—'}</div>
          {combination?.savings != null && (
            <div className="text-xs text-muted">Économie estimée: {combination.savings.toFixed(2)} € ({combination.savingsPct}% )</div>
          )}
        </div>
        <div className="text-sm text-muted">Totale: {combination?.total ? combination.total.toFixed(2) : '—'} €</div>
      </div>
      <ul className="mt-2 text-sm space-y-1">
        {(combination?.items || []).map((it, i) => (
          <li key={i} className="flex justify-between">
            <span>{it.nom} <span className="text-xs text-muted">({it.magasin || '—'})</span></span>
            <span className="font-medium">{it.prix ? `${it.prix.toFixed(2)} €` : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
