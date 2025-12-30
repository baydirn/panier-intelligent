import React from 'react'
import InstallPWAButton from './InstallPWAButton'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from './Button'

const tabs = [
  {to: '/liste', label: 'Liste'},
  {to: '/analyse', label: 'Analyse'},
  {to: '/magasin', label: 'Magasin'},
  {to: '/mes-listes', label: 'Mes Listes'},
  {to: '/recurrentes', label: 'Récurrentes'},
  {to: '/parametres', label: 'Paramètres'}
]

export default function Header(){
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  async function handleLogout() {
    try {
      await logout()
      navigate('/auth')
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  return (
    <header className="bg-white border-b hidden md:block sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛒</span>
          <h1 className="text-xl font-semibold text-gray-900">Panier Intelligent</h1>
          <InstallPWAButton />
        </div>
        <nav className="flex space-x-1 items-center gap-4">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({isActive}) => `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >{t.label}</NavLink>
          ))}
          
          {/* User info + logout OR login button */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l">
            {user ? (
              <>
                <span className="text-xs text-gray-600">
                  <span className="font-semibold">{user?.email}</span><br/>
                  <span className="text-amber-600">{user?.tier === 'premium' ? '⭐ Premium' : '📁 Gratuit'}</span>
                </span>
                <Button
                  variant="secondary"
                  className="text-xs px-3 py-1"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                className="text-sm px-4 py-2"
                onClick={() => navigate('/auth')}
              >
                Se connecter
              </Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

