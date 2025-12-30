/**
 * AuthContext - Gestion authentification avec Firebase
 *
 * Supporte:
 * - Google Sign-In
 * - Email/Password
 * - Persistance de session
 * - Gestion des tiers (free/premium)
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../config/firebase.config'

const AuthContext = createContext(null)

/**
 * AuthProvider component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Écouter les changements d'authentification Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Récupérer les données utilisateur depuis Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || userData.displayName,
              photoURL: firebaseUser.photoURL || userData.photoURL,
              tier: userData.tier || 'free',
              createdAt: userData.createdAt,
              preferences: userData.preferences || {},
              location: userData.location || null
            })
          } else {
            // Créer le document utilisateur s'il n'existe pas
            const newUserData = {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              photoURL: firebaseUser.photoURL || null,
              tier: 'free',
              createdAt: new Date(),
              preferences: {
                maxStores: 3,
                maxRadiusKm: 10,
                favoriteStores: []
              },
              location: null
            }

            await setDoc(doc(db, 'users', firebaseUser.uid), newUserData)

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: newUserData.displayName,
              photoURL: newUserData.photoURL,
              tier: 'free',
              createdAt: newUserData.createdAt,
              preferences: newUserData.preferences,
              location: null
            })
          }

          console.log('[AuthContext] Session restored:', firebaseUser.email)
        } catch (err) {
          console.error('[AuthContext] Error loading user data:', err)
          setError(err.message)
        }
      } else {
        setUser(null)
        console.log('[AuthContext] No session found - user must login')
      }

      setLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  /**
   * Signup with email/password
   */
  async function signup(email, password, displayName = null) {
    try {
      setError(null)

      // Créer le compte Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password)

      // Mettre à jour le profil avec le displayName
      if (displayName) {
        await updateProfile(result.user, { displayName })
      }

      // Créer le document utilisateur dans Firestore
      const userData = {
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: null,
        tier: 'free',
        createdAt: new Date(),
        preferences: {
          maxStores: 3,
          maxRadiusKm: 10,
          favoriteStores: []
        },
        location: null
      }

      await setDoc(doc(db, 'users', result.user.uid), userData)

      console.log('[AuthContext] Signup successful:', email)

      return {
        uid: result.user.uid,
        ...userData
      }
    } catch (err) {
      console.error('[AuthContext] Signup error:', err)
      setError(err.message)
      throw err
    }
  }

  /**
   * Login with email/password
   */
  async function login(email, password) {
    try {
      setError(null)

      const result = await signInWithEmailAndPassword(auth, email, password)

      console.log('[AuthContext] Login successful:', email)

      return result.user
    } catch (err) {
      console.error('[AuthContext] Login error:', err)
      setError(err.message)
      throw err
    }
  }

  /**
   * Login with Google
   */
  async function loginWithGoogle() {
    try {
      setError(null)

      const result = await signInWithPopup(auth, googleProvider)

      // Vérifier si l'utilisateur existe déjà dans Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid))

      if (!userDoc.exists()) {
        // Créer le document utilisateur
        const userData = {
          email: result.user.email,
          displayName: result.user.displayName || result.user.email.split('@')[0],
          photoURL: result.user.photoURL || null,
          tier: 'free',
          createdAt: new Date(),
          preferences: {
            maxStores: 3,
            maxRadiusKm: 10,
            favoriteStores: []
          },
          location: null
        }

        await setDoc(doc(db, 'users', result.user.uid), userData)
      }

      console.log('[AuthContext] Google login successful')

      return result.user
    } catch (err) {
      console.error('[AuthContext] Google login error:', err)
      setError(err.message)
      throw err
    }
  }

  /**
   * Logout
   */
  async function logout() {
    try {
      setError(null)

      await signOut(auth)

      console.log('[AuthContext] Logout successful')
    } catch (err) {
      console.error('[AuthContext] Logout error:', err)
      setError(err.message)
      throw err
    }
  }

  /**
   * Update user tier (typically called after Stripe payment)
   */
  async function updateUserTier(tier) {
    if (!user) throw new Error('No user logged in')

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        tier
      })

      setUser({ ...user, tier })

      console.log('[AuthContext] User tier updated:', tier)

      return { ...user, tier }
    } catch (err) {
      console.error('[AuthContext] Update tier error:', err)
      throw err
    }
  }

  /**
   * Update user preferences
   */
  async function updateUserPreferences(preferences) {
    if (!user) throw new Error('No user logged in')

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        preferences: {
          ...user.preferences,
          ...preferences
        }
      })

      setUser({
        ...user,
        preferences: {
          ...user.preferences,
          ...preferences
        }
      })

      console.log('[AuthContext] User preferences updated')

      return user
    } catch (err) {
      console.error('[AuthContext] Update preferences error:', err)
      throw err
    }
  }

  /**
   * Update user location
   */
  async function updateUserLocation(lat, lon, city = null) {
    if (!user) throw new Error('No user logged in')

    try {
      const location = { lat, lon, city }

      await updateDoc(doc(db, 'users', user.uid), {
        location
      })

      setUser({ ...user, location })

      console.log('[AuthContext] User location updated')

      return user
    } catch (err) {
      console.error('[AuthContext] Update location error:', err)
      throw err
    }
  }

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserTier,
    updateUserPreferences,
    updateUserLocation
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
