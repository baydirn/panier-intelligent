import React, { useEffect, useState, useMemo } from 'react'
import { getPriceHistory } from '../services/db'

export default function PriceHistorySparkline({ name, width = 140, height = 40 }){
  const [history, setHistory] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load(){
      const hist = await getPriceHistory(name)
      if(!cancelled) setHistory(hist)
    }
    if(name) load()
    return () => { cancelled = true }
  }, [name])

  const { points, min, max, last, trend } = useMemo(() => {
    if(!history || history.length === 0){
      return { points: '', min: 0, max: 0, last: null, trend: 0 }
    }
    const prices = history.map(h => h.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const last = prices[prices.length - 1]
    const prev = prices.length > 1 ? prices[prices.length - 2] : last
    const trend = last - prev

    const n = prices.length
    const w = width - 4
    const h = height - 4
    const scaleX = n > 1 ? w / (n - 1) : 0
    const scaleY = (p) => {
      if(max === min) return h / 2
      return h - ((p - min) / (max - min)) * h
    }

    const pts = prices.map((p, i) => `${2 + i * scaleX},${2 + scaleY(p)}`).join(' ')
    return { points: pts, min, max, last, trend }
  }, [history, width, height])

  if(!history || history.length === 0){
    return (
      <div className="text-xs text-gray-400">Pas d'historique</div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="text-blue-600">
        <rect x="0" y="0" width={width} height={height} rx="6" ry="6" fill="#F8FAFC" />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
        />
      </svg>
      <div className="text-xs">
        <div className="font-semibold">{last?.toFixed ? `${last.toFixed(2)} $` : `${last} $`}</div>
        <div className={"" + (trend < 0 ? 'text-emerald-600' : trend > 0 ? 'text-red-600' : 'text-gray-500')}>
          {trend < 0 ? '↘' : trend > 0 ? '↗' : '→'} {Math.abs(trend).toFixed(2)}
        </div>
      </div>
    </div>
  )
}
