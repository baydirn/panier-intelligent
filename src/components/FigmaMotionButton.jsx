import React from 'react'
import { motion } from 'framer-motion'

export default function FigmaMotionButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  whileHover = { scale: 1.02 },
  whileTap = { scale: 0.98 },
  ...props
}) {
  const baseClasses = 'rounded-2xl font-medium transition-all'
  
  const variants = {
    primary: 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    icon: 'w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200',
  }

  return (
    <motion.button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`}
      whileHover={whileHover}
      whileTap={whileTap}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
