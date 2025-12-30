import React from 'react'
import { render, screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import MesListes from '../MesListes'

const navigateMock = vi.fn()
const toastMock = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-123' } })
}))

vi.mock('../../components/ToastProvider', () => ({
  useToast: () => ({ addToast: toastMock })
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock
  }
})

const getSavedListSnapshots = vi.fn()
const loadSavedListSnapshot = vi.fn()
const deleteSavedListSnapshot = vi.fn()

vi.mock('../../services/firestore', () => ({
  getSavedListSnapshots: (...args) => getSavedListSnapshots(...args),
  loadSavedListSnapshot: (...args) => loadSavedListSnapshot(...args),
  deleteSavedListSnapshot: (...args) => deleteSavedListSnapshot(...args)
}))

vi.mock('../../store/useFirestoreStore', () => ({
  default: vi.fn((selector) => {
    const store = {
      loadProducts: vi.fn(async () => [])
    }
    return selector(store)
  })
}))

describe('MesListes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigateMock.mockReset()
    toastMock.mockReset?.()
    getSavedListSnapshots.mockImplementation(async () => [])
    loadSavedListSnapshot.mockResolvedValue()
    deleteSavedListSnapshot.mockResolvedValue()
  })

  afterEach(() => {
    // Reset confirm between tests to avoid leakage
    global.confirm = originalConfirm
    cleanup()
  })

  const originalConfirm = global.confirm

  it('affiche l\'état vide quand aucune liste n\'est trouvée', async () => {
    getSavedListSnapshots.mockResolvedValueOnce([])

    render(<MesListes />)

    await waitFor(() => {
      expect(getSavedListSnapshots).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.queryByText(/Chargement des listes/i)).not.toBeInTheDocument()
    })
    expect(screen.getByText(/Aucune liste sauvegardée/i)).toBeInTheDocument()
  })

  it('affiche une liste sauvegardée et permet le chargement', async () => {
    const sampleList = {
      id: 'list-1',
      name: 'Courses semaine',
      products: [{ nom: 'Lait', quantite: 2 }],
      createdAt: new Date('2024-01-01T00:00:00Z')
    }

    getSavedListSnapshots.mockResolvedValueOnce([sampleList])

    render(<MesListes />)

    await waitFor(() => {
      expect(getSavedListSnapshots).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.queryByText(/Chargement des listes/i)).not.toBeInTheDocument()
    })
    expect(screen.getByText('Courses semaine')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Charger/i }))

    expect(loadSavedListSnapshot).toHaveBeenCalledWith('user-123', 'list-1')
    expect(navigateMock).toHaveBeenCalledWith('/liste')
  })

  it('supprime une liste après confirmation et rafraîchit la vue', async () => {
    const sampleList = {
      id: 'list-2',
      name: 'Courses test',
      products: [{ nom: 'Pain', quantite: 1 }],
      createdAt: new Date('2024-02-02T00:00:00Z')
    }

    getSavedListSnapshots
      .mockResolvedValueOnce([sampleList])
      .mockResolvedValueOnce([]) // après suppression, liste vide

    global.confirm = vi.fn(() => true)

    render(<MesListes />)

    await waitFor(() => {
      expect(getSavedListSnapshots).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.queryByText(/Chargement des listes/i)).not.toBeInTheDocument()
    })
    expect(screen.getByText('Courses test')).toBeInTheDocument()

    const card = screen.getByText('Courses test').closest('.bg-white')
    const deleteButton = within(card).getByRole('button', { name: /Supprimer/i })

    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(deleteSavedListSnapshot).toHaveBeenCalledWith('list-2')
    })

    expect(getSavedListSnapshots).toHaveBeenCalledTimes(2)
  })
})
