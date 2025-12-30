import React from 'react'
import { useEffect } from 'react'
import { getAllPriceAlerts, getLatestPrice } from './services/db'
import { useToast } from './components/ToastProvider'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
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
import Admin from './pages/Admin'
import Auth from './pages/Auth'
import SharedList from './pages/SharedList'
import NotFound from './pages/NotFound'
import MobilePreview from './components/MobilePreview'

export default function App(){
  const { addToast } = useToast()
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()
  const isAdminPage = location.pathname === '/admin'
  const isAuthPage = location.pathname === '/auth'
  const isSharedPage = location.pathname.startsWith('/shared/')
  const isListPage = location.pathname === '/' || location.pathname === '/liste'
  const isPreviewPage = location.pathname.startsWith('/preview/')

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

  // Show loading while auth context initializes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Redirect non-authenticated users to auth page (including shared links - login required)
  if (!isAuthenticated && !isAuthPage && !isPreviewPage) {
    return <Auth />
  }

  return (
    <div className="min-h-screen">
      {!isAdminPage && !isAuthPage && !isPreviewPage && (
        <>
          <InstallPWAButton variant="banner" />
          <IOSInstallPrompt />
          <Header />
        </>
      )}
      <main className={isAdminPage || isAuthPage || isListPage || isPreviewPage || isSharedPage ? '' : 'container pb-20 animate-fade-in'}>
        <Routes>
          <Route path="/" element={<Liste/>} />
          <Route path="/auth" element={<Auth/>} />
          <Route path="/liste" element={<Liste/>} />
          <Route path="/mobile" element={<MobilePreview/>} />
          <Route path="/preview/*" element={<MobilePreview/>} />
          <Route path="/preview/mobile" element={<MobilePreview/>} />
          <Route path="/shared/:code" element={<SharedList/>} />
          <Route path="/analyse" element={<Analyse/>} />
          <Route path="/magasin" element={<Magasin/>} />
          <Route path="/recurrentes" element={<Recurrentes/>} />
          <Route path="/mes-listes" element={<MesListes/>} />
          <Route path="/parametres" element={<Parametres/>} />
          <Route path="/admin" element={<Admin/>} />
          <Route path="*" element={<NotFound/>} />
        </Routes>
      </main>
      {!isAdminPage && !isAuthPage && !isSharedPage && !isListPage && <BottomNav />}
    </div>
  )
}
