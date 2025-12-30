import React, { useState } from 'react'
import Liste from '../pages/Liste'
import Analyse from '../pages/Analyse'
import Parametres from '../pages/Parametres'

export default function MobilePreview(){
  const [view, setView] = useState('liste')
  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center py-6">
      <div className="mb-4 flex gap-2">
        <button onClick={() => setView('liste')} className={`px-3 py-2 rounded-lg ${view==='liste' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Liste</button>
        <button onClick={() => setView('analyse')} className={`px-3 py-2 rounded-lg ${view==='analyse' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Optimisation</button>
        <button onClick={() => setView('parametres')} className={`px-3 py-2 rounded-lg ${view==='parametres' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Paramètres</button>
      </div>
      <div className="w-[390px] h-[844px] rounded-[40px] shadow-2xl border border-gray-300 overflow-hidden bg-white">
        {view === 'liste' && <Liste />}
        {view === 'analyse' && <Analyse />}
        {view === 'parametres' && <Parametres />}
      </div>
      <p className="mt-3 text-sm text-gray-600">Aperçu mobile (390×844, coins arrondis)</p>
    </div>
  )
}
