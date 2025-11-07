import React from 'react'
import { NavLink } from 'react-router-dom'

// Inline minimal icons to avoid extra deps
function IconList(){return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z"/>
  </svg>
)}
function IconAnalyse(){return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M3 3.75A.75.75 0 013.75 3h2.5a.75.75 0 01.75.75v16.5a.75.75 0 01-.75.75h-2.5A.75.75 0 013 20.25V3.75zm6 6A.75.75 0 019.75 9h2.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-2.5a.75.75 0 01-.75-.75V9.75zm6-4.5A.75.75 0 0115.75 6h2.5a.75.75 0 01.75.75v14.5a.75.75 0 01-.75.75h-2.5a.75.75 0 01-.75-.75V6.75z"/>
  </svg>
)}
function IconStore(){return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M3 7.5l1.5 9A2.25 2.25 0 006.72 18h10.56a2.25 2.25 0 002.22-1.5L21 7.5H3zm0-1.5h18l-.9-2.7A1.5 1.5 0 0018.69 2.25H5.31A1.5 1.5 0 003.9 3.3L3 6z"/>
  </svg>
)}
function IconRepeat(){return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M4.5 7.5A4.5 4.5 0 019 3h6.75a.75.75 0 010 1.5H9a3 3 0 100 6h8.19l-1.72-1.72a.75.75 0 111.06-1.06l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06L17.19 12H9a4.5 4.5 0 01-4.5-4.5z"/>
  </svg>
)}
function IconFolder(){return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M2.25 6A2.25 2.25 0 014.5 3.75h4.94l1.28 1.28a1.5 1.5 0 001.06.44h6.72A2.25 2.25 0 0120.75 8v10.5A2.25 2.25 0 0118.5 20.75H4.5A2.25 2.25 0 012.25 18.5V6z"/>
  </svg>
)}

const tabs = [
  { to: '/liste', label: 'Liste', Icon: IconList },
  { to: '/analyse', label: 'Analyse', Icon: IconAnalyse },
  { to: '/magasin', label: 'Magasin', Icon: IconStore },
  { to: '/mes-listes', label: 'Mes Listes', Icon: IconFolder },
  { to: '/recurrentes', label: 'Récurrentes', Icon: IconRepeat }
]

export default function BottomNav(){
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t">
      <div className="max-w-3xl mx-auto grid grid-cols-5">
        {tabs.map(({to, label, Icon}) => (
          <NavLink
            key={to}
            to={to}
            className={({isActive}) => `flex flex-col items-center justify-center py-2 text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600 transition-colors`}
          >
            <Icon />
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
