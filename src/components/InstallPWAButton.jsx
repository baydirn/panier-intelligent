import React, { useEffect, useRef, useState } from 'react'

export default function InstallPWAButton({ className = '', variant = 'button' }){
  const deferredPromptRef = useRef(null)
  const [canInstall, setCanInstall] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    function onBeforeInstallPrompt(e){
      // Prevent the mini-infobar
      e.preventDefault()
      deferredPromptRef.current = e
      setCanInstall(true)
    }
    function onAppInstalled(){
      setInstalled(true)
      setCanInstall(false)
      deferredPromptRef.current = null
    }

    // Already installed?
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches){
      setInstalled(true)
    }
    // iOS standalone check
    if (window.navigator && window.navigator.standalone === true){
      setInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    
    // Check if previously dismissed (banner variant only)
    if (variant === 'banner') {
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (dismissed) setDismissed(true)
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [variant])

  const handleInstall = async () => {
    const evt = deferredPromptRef.current
    if (!evt) return
    evt.prompt()
    const choice = await evt.userChoice.catch(()=>null)
    if (choice && choice.outcome === 'accepted'){
      setInstalled(true)
      setCanInstall(false)
      deferredPromptRef.current = null
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (installed || !canInstall || (dismissed && variant === 'banner')) return null

  // Banner variant for mobile
  if (variant === 'banner') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">🛒</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Installer l'application</p>
              <p className="text-xs opacity-90">Accès rapide et mode hors ligne</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 active:scale-95 transition"
            >
              Installer
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-blue-800 rounded-lg transition"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Button variant for desktop header
  return (
    <button
      onClick={handleInstall}
      className={`px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium active:scale-95 transition ${className}`}
      title="Installer l'application"
    >
      ⬇️ Installer
    </button>
  )
}
