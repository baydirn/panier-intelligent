import React, { useState, useEffect } from 'react'
import { getAllProducts, getRecurrentProducts, getPriceHistory } from '../services/db'
import Card from '../components/Card'
import PriceHistorySparkline from '../components/PriceHistorySparkline'

export default function Statistiques() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [topProducts, setTopProducts] = useState([])

  useEffect(() => {
    loadStatistics()
  }, [])

  async function loadStatistics() {
    setLoading(true)
    try {
      const products = await getAllProducts()
      const recurrents = await getRecurrentProducts()
      
      // Calculate basic stats
      const totalProducts = products.length
      const totalRecurrents = recurrents.filter(r => r.active).length
      const productsWithPrice = products.filter(p => p.prix != null).length
      const totalValue = products.reduce((sum, p) => {
        const price = p.prix ?? 0
        const qty = p.quantite ?? 1
        return sum + (price * qty)
      }, 0)

      // Calculate average price per store
      const storeStats = {}
      for (const p of products) {
        if (p.magasin && p.prix != null) {
          if (!storeStats[p.magasin]) {
            storeStats[p.magasin] = { total: 0, count: 0, items: [] }
          }
          storeStats[p.magasin].total += p.prix * (p.quantite ?? 1)
          storeStats[p.magasin].count += (p.quantite ?? 1)
          storeStats[p.magasin].items.push(p)
        }
      }

      // Get price trends for top recurring products
      const topRecurring = recurrents
        .filter(r => r.active)
        .slice(0, 10)
      
      const productTrends = []
      for (const rec of topRecurring) {
        const history = await getPriceHistory(rec.name)
        if (history.length > 0) {
          const prices = history.map(h => h.price)
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
          const minPrice = Math.min(...prices)
          const maxPrice = Math.max(...prices)
          const latestPrice = prices[prices.length - 1]
          
          productTrends.push({
            name: rec.name,
            avgPrice,
            minPrice,
            maxPrice,
            latestPrice,
            historyCount: history.length,
            trend: latestPrice < avgPrice ? 'down' : latestPrice > avgPrice ? 'up' : 'stable'
          })
        }
      }

      // Calculate potential savings (if we always bought at lowest historical price)
      let potentialSavings = 0
      for (const trend of productTrends) {
        if (trend.latestPrice > trend.minPrice) {
          potentialSavings += (trend.latestPrice - trend.minPrice)
        }
      }

      setStats({
        totalProducts,
        totalRecurrents,
        productsWithPrice,
        coveragePercent: totalProducts > 0 ? Math.round((productsWithPrice / totalProducts) * 100) : 0,
        totalValue,
        storeStats,
        potentialSavings
      })
      
      setTopProducts(productTrends)
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold">📊 Statistiques</h1>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold">📊 Statistiques</h1>
        <Card>
          <p className="text-gray-600">Aucune donnée disponible</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📊 Statistiques</h1>
        <button 
          onClick={loadStatistics}
          className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 active:scale-95 transition"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalProducts}</div>
            <div className="text-sm text-gray-600 mt-1">Produits</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalRecurrents}</div>
            <div className="text-sm text-gray-600 mt-1">Récurrents</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.coveragePercent}%</div>
            <div className="text-sm text-gray-600 mt-1">Avec prix</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">${stats.totalValue.toFixed(2)}</div>
            <div className="text-sm text-gray-600 mt-1">Valeur totale</div>
          </div>
        </Card>
      </div>

      {/* Potential Savings */}
      {stats.potentialSavings > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">💰 Économies potentielles</h3>
              <p className="text-sm text-gray-600 mt-1">
                Si vous aviez acheté au prix le plus bas historique
              </p>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${stats.potentialSavings.toFixed(2)}
            </div>
          </div>
        </Card>
      )}

      {/* Store Statistics */}
      {Object.keys(stats.storeStats).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">🏪 Par magasin</h3>
          <div className="space-y-3">
            {Object.entries(stats.storeStats)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([store, data]) => (
                <div key={store} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{store}</div>
                    <div className="text-sm text-gray-600">
                      {data.count} article{data.count > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">${data.total.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      ${(data.total / data.count).toFixed(2)} moy.
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Top Products with Price Trends */}
      {topProducts.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">📈 Tendances des prix (produits récurrents)</h3>
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {product.historyCount} observation{product.historyCount > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-semibold text-gray-900">${product.latestPrice.toFixed(2)}</div>
                    <div className={`text-xs flex items-center justify-end gap-1 ${
                      product.trend === 'down' ? 'text-green-600' : 
                      product.trend === 'up' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {product.trend === 'down' && '↓ Baisse'}
                      {product.trend === 'up' && '↑ Hausse'}
                      {product.trend === 'stable' && '→ Stable'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                  <span>Min: ${product.minPrice.toFixed(2)}</span>
                  <span>Moy: ${product.avgPrice.toFixed(2)}</span>
                  <span>Max: ${product.maxPrice.toFixed(2)}</span>
                </div>
                
                <PriceHistorySparkline name={product.name} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <h3 className="text-lg font-semibold mb-3">💡 Conseils</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Consultez régulièrement les tendances pour acheter au bon moment</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Les prix baissent généralement en promotion - attendez si possible</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Comparez les magasins pour maximiser vos économies</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
