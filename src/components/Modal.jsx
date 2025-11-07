import React from 'react'

/**
 * Modal component - backdrop + centered card
 * Usage: Wrap in conditional render OR use isOpen prop
 */
export default function Modal({ isOpen = true, onClose, title, children, footer }){
  if(isOpen === false) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-fade-in" onClick={e => e.stopPropagation()}>
        {title && (
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        <div className="px-6 py-4">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex gap-2 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
