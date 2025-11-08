import React, { useEffect, useState } from 'react'

export default function IOSInstallPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    
    // Already installed?
    const isStandalone = window.navigator.standalone === true ||
                         window.matchMedia('(display-mode: standalone)').matches
    
    // Previously dismissed?
    const dismissed = localStorage.getItem('ios-install-dismissed')
    
    if (isIOS && !isStandalone && !dismissed) {
      // Show after 3 seconds to not overwhelm the user
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('ios-install-dismissed', 'true')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-up">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛒</span>
            <h3 className="text-lg font-bold text-gray-900">Installer Panier Intelligent</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Installez cette application sur votre écran d'accueil pour un accès rapide et une expérience optimale.
        </p>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
              1
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Appuyez sur le bouton <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 rounded text-blue-700 mx-1">⬆️</span> <strong>Partager</strong> en bas de l'écran
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Faites défiler et sélectionnez <strong>"Sur l'écran d'accueil"</strong>
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
              3
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Appuyez sur <strong>"Ajouter"</strong>
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition active:scale-95"
        >
          Compris !
        </button>
      </div>
    </div>
  )
}
