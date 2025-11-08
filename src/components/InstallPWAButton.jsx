import React, { useEffect, useRef, useState } from 'react'

export default function InstallPWAButton({ className = '' }){
  const deferredPromptRef = useRef(null)
  const [canInstall, setCanInstall] = useState(false)
  const [installed, setInstalled] = useState(false)

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

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

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

  if (installed || !canInstall) return null

  return (
    <button
      onClick={handleInstall}
      className={`px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm active:scale-95 transition ${className}`}
      title="Installer l'application"
    >
      ⬇️ Installer
    </button>
  )
}
