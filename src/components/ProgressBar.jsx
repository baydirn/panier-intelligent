import React from 'react'

// Props:
// - percent: number 0..100
// - showLabel: boolean (default true)
// - color: optional tailwind class for bar color; if not provided, color is based on percent (red < 40, yellow 40-80, green > 80)
export default function ProgressBar({percent = 0, showLabel = true, color}){
  const p = Math.max(0, Math.min(100, Number(percent) || 0))
  const autoColor = p < 40 ? 'bg-red-500' : p < 80 ? 'bg-yellow-500' : 'bg-green-600'
  const barColor = color || autoColor
  return (
    <div>
      <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
        <div className={`h-3 ${barColor} transition-all`} style={{ width: `${p}%` }} />
      </div>
      {showLabel && <div className="text-xs text-gray-500 mt-1">{p}%</div>}
    </div>
  )
}
