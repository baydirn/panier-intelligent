/**
 * Auth Page - Login & Signup
 * 
 * UI for Firebase authentication with Google, Email, Facebook
 * Mock mode for Phase 1.1 testing
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'

export default function Auth() {
  const navigate = useNavigate()
  const { signup, login, loginWithGoogle, loginWithFacebook, error: authError } = useAuth()
  
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Les mots de passe ne correspondent pas')
        }
        if (password.length < 6) {
          throw new Error('Le mot de passe doit contenir au moins 6 caractères')
        }
        await signup(email, password, 'free')
      } else {
        await login(email, password)
      }
      
      // Redirect to home AFTER auth completes
      console.log('[Auth] Redirecting to home...')
      setTimeout(() => navigate('/'), 200)
    } catch (e) {
      setError(e.message || 'Erreur authentification')
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError('')
    setLoading(true)
    try {
      console.log('[Auth] Google login initiated')
      await loginWithGoogle()
      console.log('[Auth] Google login successful, redirecting...')
      // Redirect to home AFTER auth completes
      setTimeout(() => navigate('/'), 200)
    } catch (e) {
      console.error('[Auth] Google login failed:', e)
      setError(e.message || 'Erreur Google login')
      setLoading(false)
    }
  }

  async function handleFacebookLogin() {
    setError('')
    setLoading(true)
    try {
      console.log('[Auth] Facebook login initiated')
      await loginWithFacebook()
      console.log('[Auth] Facebook login successful, redirecting...')
      // Redirect to home AFTER auth completes
      setTimeout(() => navigate('/'), 200)
    } catch (e) {
      console.error('[Auth] Facebook login failed:', e)
      setError(e.message || 'Erreur Facebook login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🛒 Panier Intelligent</h1>
          <p className="text-gray-600 mt-2">
            {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </p>
        </div>

        {/* Error messages */}
        {(error || authError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error || authError}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4 mb-6">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          {mode === 'signup' && (
            <Input
              type="password"
              placeholder="Confirmer mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? '⏳ Chargement...' : (mode === 'login' ? 'Se connecter' : 'Créer un compte')}
          </Button>
        </form>

        {/* Toggle signup/login */}
        <div className="text-center mb-6 pb-6 border-b">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? 'Pas de compte? ' : 'Vous avez un compte? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError('')
                setEmail('')
                setPassword('')
                setConfirmPassword('')
              }}
              className="text-blue-600 hover:underline font-semibold"
              disabled={loading}
            >
              {mode === 'login' ? 'Créer un' : 'Se connecter'}
            </button>
          </p>
        </div>

        {/* Social login */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou continuez avec</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <span>🔵</span> Google
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleFacebookLogin}
            disabled={loading}
          >
            <span>📘</span> Facebook
          </Button>
        </div>

        {/* Demo mode info */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs space-y-1">
          <p><strong>🧪 Mode Test (Phase 1.1):</strong></p>
          <ul className="list-disc list-inside text-amber-600">
            <li>Email: N'importe lequel (test@example.com)</li>
            <li>Password: Minimum 6 caractères</li>
            <li>Google/Facebook: Crée compte auto</li>
            <li>Tous les comptes = GRATUIT (tier = free)</li>
            <li>Données sauvegardées en localStorage</li>
          </ul>
          <p className="mt-2 text-amber-600">
            <strong>Phase 1.2:</strong> Firebase vraie config après tests réussis
          </p>
        </div>
      </Card>
    </div>
  )
}
