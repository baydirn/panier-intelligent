/**
 * Helper functions for list management
 */
import { getSavedLists } from '../services/db'

/**
 * Check if user has any saved lists (personal or shared)
 * This should be used before showing "create first list" prompts
 * to avoid showing them when user already has lists saved
 */
export async function userHasSavedLists() {
  try {
    const lists = await getSavedLists()
    return lists && lists.length > 0
  } catch (error) {
    console.error('Error checking saved lists:', error)
    return false
  }
}

/**
 * Check if a "create first list" modal should be shown
 * Returns true only if:
 * - User has no saved lists
 * - User hasn't dismissed the prompt before
 */
export async function shouldShowCreateListPrompt() {
  // Check if user has already dismissed the prompt
  const dismissed = sessionStorage.getItem('createListPromptDismissed')
  if (dismissed === 'true') {
    return false
  }

  // Check if user has saved lists
  const hasSavedLists = await userHasSavedLists()
  
  // Only show if user has NO saved lists
  return !hasSavedLists
}

/**
 * Mark the create list prompt as dismissed for this session
 */
export function dismissCreateListPrompt() {
  sessionStorage.setItem('createListPromptDismissed', 'true')
}
