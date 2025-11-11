// src/domain/adminUpload.js
// Feature flag and stubbed admin-only OCR upload gate.

/**
 * Determine if community OCR uploads (non-admin) are enabled.
 * Controlled by build-time env var: VITE_COMMUNITY_OCR_UPLOAD_ENABLED ("true" | "false").
 * Default: false (admin-only).
 * @returns {boolean}
 */
export function isCommunityOcrEnabled(){
  const flag = import.meta?.env?.VITE_COMMUNITY_OCR_UPLOAD_ENABLED
  return String(flag).toLowerCase() === 'true'
}

/**
 * Placeholder: would verify current user has admin rights.
 * Replace with real auth check when profiles are introduced.
 * @returns {boolean}
 */
export function isAdmin(){
  // For now assume always true locally; adjust when auth integrated.
  return true
}

/**
 * Gate: can the upload modal be shown?
 * Community disabled by default unless flag true; admin bypasses.
 * @returns {boolean}
 */
export function canShowOcrUpload(){
  if(isAdmin()) return true
  return isCommunityOcrEnabled()
}
