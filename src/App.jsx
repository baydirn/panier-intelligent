import React from 'react'
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

export default function App(){
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
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
