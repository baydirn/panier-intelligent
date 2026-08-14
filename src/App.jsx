import React from 'react'
import { useEffect } from 'react'
import { getAllPriceAlerts, getLatestPrice } from './services/db'
import { useToast } from './components/ToastProvider'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import InstallPWAButton from './components/InstallPWAButton'
import IOSInstallPrompt from './components/IOSInstallPrompt'
import Liste from './pages/Liste'
import Analyse from './pages/Analyse'
import Magasin from './pages/Magasin'
import Recurrentes from './pages/Recurrentes'
import MesListes from './pages/MesListes'
import Parametres from './pages/Parametres'
import Statistiques from './pages/Statistiques'

export default function App(){
  const { addToast } = useToast()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try{
        const alerts = await getAllPriceAlerts()
        const entries = Object.entries(alerts || {})
        for(const [name, cfg] of entries){
          const latest = await getLatestPrice(name)
          if(!mounted) return
          const price = latest?.price
          if(price != null && cfg?.targetPrice != null && price <= cfg.targetPrice){
            addToast(`⏰ ${name}: ${price.toFixed(2)}$ ≤ cible ${cfg.targetPrice.toFixed(2)}$`, 'success')
          }
        }
      }catch(_){/* ignore */}
    })()
    return () => { mounted = false }
  }, [addToast])

  return (
    <div className="min-h-screen">
      <InstallPWAButton variant="banner" />
      <IOSInstallPrompt />
      <Header />
  <main className="container pb-20 animate-fade-in">
        <Routes>
          <Route path="/" element={<Liste/>} />
          <Route path="/liste" element={<Liste/>} />
          <Route path="/analyse" element={<Analyse/>} />
          <Route path="/magasin" element={<Magasin/>} />
          <Route path="/recurrentes" element={<Recurrentes/>} />
          <Route path="/mes-listes" element={<MesListes/>} />
          <Route path="/parametres" element={<Parametres/>} />
          <Route path="/statistiques" element={<Statistiques/>} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
