import React from 'react'

/**
 * Card component - clean container with variants
 */
export default function Card({ children, className = '', hover = false, ...props }){
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-4 ${hover ? 'hover:shadow-md transition-shadow' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }){
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }){
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
}

export function CardBody({ children, className = '' }){
  return <div className={className}>{children}</div>
}
