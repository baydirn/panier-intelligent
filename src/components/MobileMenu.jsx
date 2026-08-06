import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { clearCurrentList } from '../services/db'
import { useToast } from './ToastProvider'

const tabs = [
  { to: '/liste', label: 'Liste' },
  { to: '/analyse', label: 'Analyse' },
  { to: '/magasin', label: 'Magasin' },
  { to: '/mes-listes', label: 'Mes Listes' },
  { to: '/recurrentes', label: 'Récurrentes' },
  { to: '/parametres', label: 'Paramètres' }
]

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { addToast } = useToast()

  async function handleLogout() {
    if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ? Toutes les données locales seront effacées.')) {
      return
    }
    
    try {
      // Clear all local storage data
      await clearCurrentList()
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear IndexedDB
      if (window.indexedDB) {
        try {
          if (typeof window.indexedDB.databases === 'function') {
            const databases = await window.indexedDB.databases()
            databases.forEach(db => {
              window.indexedDB.deleteDatabase(db.name)
            })
          }
        } catch (error) {
          console.error('Error clearing IndexedDB:', error)
        }
      }
      
      addToast('Déconnexion réussie', 'success')
      
      // Reload page to reset app state
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Error during logout:', error)
      addToast('Erreur lors de la déconnexion', 'error')
    }
  }

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
        aria-label="Menu"
      >
        <span className="text-2xl">☰</span>
      </button>

      {/* Menu and Overlay - Only render when open */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-out Menu */}
          <div className="md:hidden fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 animate-slide-in">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              <h2 className="font-semibold text-gray-900">Menu</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label="Fermer"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-6 py-3 text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          {/* Logout Button at Bottom */}
          <div className="border-t p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>🚪</span>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
          </div>
        </>
      )}
    </>
  )
}
