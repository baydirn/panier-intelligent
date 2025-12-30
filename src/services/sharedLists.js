import { getStorageProvider } from './storage'

/**
 * Sync shared list updates whenever the main list changes
 */
export async function syncSharedListsIfNeeded(currentProducts, userEmail) {
  try {
    // Get list of shared lists the user created
    const sharedLists = await getStorageProvider().getItem('shared_lists') || []
    
    if (sharedLists.length === 0) return

    for (const listRef of sharedLists) {
      // Find the shared list in backend to get its current data
      const response = await fetch(`/api/shared-list/${listRef.shareCode}`)
      
      if (!response.ok) continue

      const data = await response.json()
      const sharedList = data.list

      // Only sync if products actually changed
      const currentProductsStr = JSON.stringify(currentProducts)
      const sharedProductsStr = JSON.stringify(sharedList.data?.products || [])
      
      if (currentProductsStr !== sharedProductsStr) {
        console.log('[syncSharedListsIfNeeded] Syncing changes to:', listRef.shareCode)
        // Send update to backend
        await updateSharedList(listRef.shareCode, currentProducts, userEmail || listRef.ownerEmail)
      }
    }
  } catch (err) {
    console.error('[syncSharedListsIfNeeded] Error:', err)
  }
}

/**
 * Update a shared list on the backend
 */
export async function updateSharedList(shareCode, products, userEmail) {
  try {
    const response = await fetch(`/api/shared-list/${shareCode}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products,
        userEmail
      })
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('[updateSharedList] Error:', err)
      return false
    }

    return true
  } catch (err) {
    console.error('[updateSharedList] Error:', err)
    return false
  }
}

/**
 * Register a shared list for syncing
 */
export async function registerSharedList(shareCode, ownerEmail, title) {
  try {
    const sharedLists = await getStorageProvider().getItem('shared_lists') || []
    
    // Check if already registered
    if (!sharedLists.some(l => l.shareCode === shareCode)) {
      sharedLists.push({ shareCode, ownerEmail, title, createdAt: new Date().toISOString() })
      await getStorageProvider().setItem('shared_lists', sharedLists)
      console.log('[registerSharedList] Registered:', shareCode)
    }
  } catch (err) {
    console.error('[registerSharedList] Error:', err)
  }
}
