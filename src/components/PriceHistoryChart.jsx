import React, { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

/**
 * Price History Chart Component
 * Displays historical price trends for a product across stores
 * @param {Object} props
 * @param {string} props.productId - Product ID to fetch history for
 * @param {string} props.productName - Product name for display
 */
export default function PriceHistoryChart({ productId, productName }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStore, setSelectedStore] = useState('all')
  const [daysBack, setDaysBack] = useState(90)

  useEffect(() => {
    if (!productId) return

    async function fetchHistory() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          daysBack: daysBack.toString()
        })
        if (selectedStore !== 'all') {
          params.append('storeId', selectedStore)
        }

        const response = await fetch(
          `http://localhost:3001/api/prices/history/${productId}?${params}`
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        setHistory(data.history || [])
      } catch (err) {
        console.error('[PriceHistory] Error fetching history:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [productId, selectedStore, daysBack])

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (history.length === 0) return null

    // Group by store
    const byStore = {}
    history.forEach(h => {
      if (!byStore[h.store_id]) {
        byStore[h.store_id] = {
          storeName: h.store_name,
          data: []
        }
      }
      byStore[h.store_id].data.push({
        x: new Date(h.valid_from),
        y: parseFloat(h.prix)
      })
    })

    // Sort each store's data by date
    Object.values(byStore).forEach(store => {
      store.data.sort((a, b) => a.x - b.x)
    })

    const colors = [
      'rgb(59, 130, 246)', // blue
      'rgb(16, 185, 129)', // green
      'rgb(239, 68, 68)',  // red
      'rgb(245, 158, 11)', // orange
      'rgb(139, 92, 246)'  // purple
    ]

    const datasets = Object.entries(byStore).map(([storeId, store], idx) => ({
      label: store.storeName,
      data: store.data,
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
      tension: 0.3,
      fill: false
    }))

    return {
      datasets
    }
  }, [history])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM d'
          }
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Prix ($)'
        },
        ticks: {
          callback: (value) => `${value.toFixed(2)}$`
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y.toFixed(2)
            return `${label}: ${value}$`
          }
        }
      },
      title: {
        display: true,
        text: `Historique des prix - ${productName || 'Produit'}`
      }
    }
  }

  // Get unique stores for filter
  const stores = React.useMemo(() => {
    const storeSet = new Set()
    history.forEach(h => {
      storeSet.add(JSON.stringify({ id: h.store_id, name: h.store_name }))
    })
    return Array.from(storeSet).map(s => JSON.parse(s))
  }, [history])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement de l'historique...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">❌ Erreur: {error}</p>
        <p className="text-sm text-red-600 mt-1">
          Vérifiez que le backend est démarré et PostgreSQL est configuré.
        </p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">📊 Aucun historique de prix disponible pour ce produit.</p>
        <p className="text-sm text-gray-500 mt-2">
          Les prix seront enregistrés automatiquement lors du téléversement de circulaires.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Magasin
          </label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Tous les magasins</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Période
          </label>
          <select
            value={daysBack}
            onChange={(e) => setDaysBack(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value={30}>30 derniers jours</option>
            <option value={90}>90 derniers jours</option>
            <option value={180}>6 mois</option>
            <option value={365}>1 an</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4" style={{ height: '400px' }}>
        {chartData && <Line data={chartData} options={chartOptions} />}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        {stores.map(store => {
          const storePrices = history
            .filter(h => h.store_id === store.id)
            .map(h => parseFloat(h.prix))
          
          if (storePrices.length === 0) return null

          const current = storePrices[0]
          const min = Math.min(...storePrices)
          const max = Math.max(...storePrices)
          const avg = storePrices.reduce((a, b) => a + b, 0) / storePrices.length

          return (
            <div key={store.id} className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-sm text-gray-900 mb-2">{store.name}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Actuel:</span>
                  <span className="font-semibold text-blue-600">{current.toFixed(2)}$</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Min:</span>
                  <span className="text-green-600">{min.toFixed(2)}$</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max:</span>
                  <span className="text-red-600">{max.toFixed(2)}$</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Moy:</span>
                  <span className="text-gray-700">{avg.toFixed(2)}$</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
