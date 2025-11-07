import React, { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import { getPriceHistory } from '../services/db'

export default function PriceHistoryModal({ isOpen, onClose, productName }){
  const [history, setHistory] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load(){
      if(!productName) return
      const hist = await getPriceHistory(productName)
      if(!cancelled) setHistory((hist || []).slice().sort((a,b)=> new Date(a.date)-new Date(b.date)))
    }
    if(isOpen) load()
    return () => { cancelled = true }
  }, [isOpen, productName])

  const { lastPrice, avg7d, entriesDesc } = useMemo(() => {
    const entries = (history || []).slice()
    const now = Date.now()
    const sevenDaysAgo = now - 7*24*60*60*1000
    const last = entries.length ? entries[entries.length-1].price : null
    const in7d = entries.filter(e => new Date(e.date).getTime() >= sevenDaysAgo)
    const avg7 = in7d.length ? in7d.reduce((s,e)=> s + Number(e.price||0), 0) / in7d.length : (entries.length ? entries.reduce((s,e)=> s + Number(e.price||0), 0)/entries.length : null)
    const desc = entries.slice().sort((a,b)=> new Date(b.date)-new Date(a.date))
    return { lastPrice: last, avg7d: avg7, entriesDesc: desc }
  }, [history])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-lg">
        <h2 className="text-xl font-bold mb-2">Historique des prix</h2>
        <div className="text-gray-600 mb-4">{productName}</div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">Dernier prix</div>
            <div className="text-lg font-semibold">{lastPrice != null ? `${Number(lastPrice).toFixed(2)} $` : '—'}</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">Moyenne 7 jours</div>
            <div className="text-lg font-semibold">{avg7d != null ? `${Number(avg7d).toFixed(2)} $` : '—'}</div>
          </div>
        </div>

        <div className="mb-4 border rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-2">
            <div>Date</div>
            <div>Magasin</div>
            <div className="text-right">Prix</div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y">
            {entriesDesc && entriesDesc.length > 0 ? entriesDesc.map((e, idx) => (
              <div key={idx} className="grid grid-cols-3 px-3 py-2 text-sm">
                <div>{new Date(e.date).toLocaleString()}</div>
                <div>{e.store || '—'}</div>
                <div className="text-right">{Number(e.price).toFixed(2)} $</div>
              </div>
            )) : (
              <div className="px-3 py-4 text-sm text-gray-500">Pas d'historique pour le moment.</div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Fermer</Button>
        </div>
      </div>
    </Modal>
  )
}
