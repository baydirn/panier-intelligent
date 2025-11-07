import React, { useState, useRef } from 'react'
import useAppStore from '../store/useAppStore'
import { getAllProducts } from '../services/db'
import Button from '../components/Button'
import Input from '../components/Input'
import Card, { CardHeader, CardTitle, CardBody } from '../components/Card'
import Badge from '../components/Badge'

export default function Parametres(){
  const settings = useAppStore(s => s.settings)
  const setSettings = useAppStore(s => s.setSettings)
  const products = useAppStore(s => s.products)
  const addProduct = useAppStore(s => s.addProduct)
  const loadProducts = useAppStore(s => s.loadProducts)
  
  const [maxStores, setMaxStores] = useState(settings.maxStoresToCombine)
  const [searchRadius, setSearchRadius] = useState(settings.searchRadiusKm || 5)
  const [favoriteStores, setFavoriteStores] = useState((settings.favoriteStores || []).join(', '))
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef(null)

  function save(){
    const stores = favoriteStores.split(',').map(s => s.trim()).filter(Boolean)
    setSettings({ 
      maxStoresToCombine: Number(maxStores),
      searchRadiusKm: Number(searchRadius),
      favoriteStores: stores
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function exportData(){
    const allProducts = await getAllProducts()
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      products: allProducts,
      settings: settings
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panier-intelligent-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function importData(event){
    const file = event.target.files?.[0]
    if(!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if(!data.products || !Array.isArray(data.products)){
        alert('Format de fichier invalide')
        return
      }

      if(!confirm(`Importer ${data.products.length} produit(s) ? Cela ajoutera les produits à ta liste existante.`)){
        return
      }

      // Import products
      for(const p of data.products){
        await addProduct(p)
      }

      // Import settings if available
      if(data.settings){
        setSettings(data.settings)
        setMaxStores(data.settings.maxStoresToCombine || 3)
        setSearchRadius(data.settings.searchRadiusKm || 5)
        setFavoriteStores((data.settings.favoriteStores || []).join(', '))
      }

      await loadProducts()
      alert(`${data.products.length} produit(s) importé(s) avec succès !`)
    } catch(err) {
      console.error(err)
      alert('Erreur lors de l\'import: ' + err.message)
    }

    // Reset input
    if(fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-sm text-gray-600 mt-1">Configure ton expérience d'achat</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres généraux</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Nombre max de magasins à combiner"
              type="number"
              min={1}
              max={5}
              value={maxStores}
              onChange={e => setMaxStores(e.target.value)}
              containerClassName="max-w-xs"
            />
            <p className="text-xs text-gray-500 -mt-2">
              Limite le nombre de magasins dans l'optimisation
            </p>

            <Input
              label="Rayon de recherche (km)"
              type="number"
              min={1}
              max={50}
              value={searchRadius}
              onChange={e => setSearchRadius(e.target.value)}
              containerClassName="max-w-xs"
            />
            <p className="text-xs text-gray-500 -mt-2">
              Distance maximale pour chercher des magasins
            </p>

            <Input
              label="Magasins favoris (séparés par des virgules)"
              type="text"
              value={favoriteStores}
              onChange={e => setFavoriteStores(e.target.value)}
              placeholder="IGA, Maxi, Metro..."
            />
            <p className="text-xs text-gray-500 -mt-2">
              Ces magasins seront priorisés dans les suggestions
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={save} variant="primary">
                Enregistrer
              </Button>
              {saved && <Badge variant="success">✓ Sauvegardé</Badge>}
            </div>
          </CardBody>
        </Card>

        {/* Import/Export */}
        <Card>
          <CardHeader>
            <CardTitle>Import / Export</CardTitle>
          </CardHeader>
          <CardBody className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Exporter mes données</h4>
              <p className="text-sm text-gray-600 mb-3">
                Télécharge toutes tes listes et paramètres en JSON
              </p>
              <Button onClick={exportData} variant="success">
                📥 Exporter
              </Button>
            </div>

            <div className="border-t pt-6">
              <h4 className="font-medium mb-2">Importer des données</h4>
              <p className="text-sm text-gray-600 mb-3">
                Importe un fichier JSON exporté précédemment
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="primary">
                📤 Importer
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{products.length}</div>
              <div className="text-sm text-gray-600 mt-1">Produits totaux</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {products.filter(p => p.recurrent).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Récurrents</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {products.filter(p => p.purchased).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Achetés</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                ${products.reduce((sum, p) => sum + (p.prix || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total estimé</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
