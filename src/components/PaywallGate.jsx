/**
 * PaywallGate - Wrapper component to restrict premium features
 * 
 * Shows paywall modal when free user tries premium feature
 */

import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Modal from './Modal'
import Button from './Button'

export default function PaywallGate({ 
  children, 
  feature = 'this feature',
  onUpgrade = null,
  fallback = null
}) {
  const { user, isAuthenticated } = useAuth()
  const [showPaywall, setShowPaywall] = useState(false)

  // Show paywall if not authenticated or free tier trying premium
  const isPremium = isAuthenticated && user?.tier === 'premium'
  
  if (isPremium) {
    // User has premium, show content
    return <>{children}</>
  }

  // User is free or not authenticated
  if (fallback) {
    return <>{fallback}</>
  }

  // Show paywall trigger
  return (
    <>
      <div onClick={() => setShowPaywall(true)} className="cursor-pointer opacity-60 hover:opacity-100">
        {children}
      </div>

      {showPaywall && (
        <Modal isOpen={showPaywall} onClose={() => setShowPaywall(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
            <h2 className="text-xl font-bold mb-4">🔒 Feature Premium</h2>
            
            <p className="text-gray-600 mb-6">
              <strong>{feature}</strong> est disponible uniquement pour les abonnés premium.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Avantages Premium:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Alertes prix en temps réel</li>
                <li>✓ Historique prix 12 mois</li>
                <li>✓ Partage familial des listes</li>
                <li>✓ Optimisation avancée multi-magasins</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowPaywall(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  if (onUpgrade) onUpgrade()
                  setShowPaywall(false)
                }}
                className="flex-1"
              >
                Upgrade Premium
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Version freemium - Premium activé pour tests
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}
