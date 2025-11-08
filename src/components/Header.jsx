import React from 'react'
import InstallPWAButton from './InstallPWAButton'
import { NavLink } from 'react-router-dom'

const tabs = [
  {to: '/liste', label: 'Liste'},
  {to: '/analyse', label: 'Analyse'},
  {to: '/magasin', label: 'Magasin'},
  {to: '/mes-listes', label: 'Mes Listes'},
  {to: '/recurrentes', label: 'Récurrentes'},
  {to: '/parametres', label: 'Paramètres'}
]

export default function Header(){
  return (
    <header className="bg-white border-b hidden md:block sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛒</span>
          <h1 className="text-xl font-semibold text-gray-900">Panier Intelligent</h1>
          <InstallPWAButton />
        </div>
        <nav className="flex space-x-1">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({isActive}) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >{t.label}</NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
