'use client'

import React from 'react'
import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-72 max-w-[72] bg-[rgba(10,10,15,0.62)] backdrop-blur-xl border-r border-white/10 p-4 flex flex-col gap-6 z-40">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2b2b2f] to-[#0a0a0f] flex items-center justify-center text-gold shadow-[0_6px_24px_rgba(197,160,89,0.12)]">
          <span className="font-serif text-lg text-[#c5a059]">F</span>
        </div>
        <div>
          <h1 className="text-sm font-medium text-white">Flux</h1>
          <p className="text-xs text-white/60">AI Studio</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-1">
          <li>
            <Link href="#" className="flex items-center gap-3 rounded-md p-3 text-sm text-white/90 hover:bg-white/3 transition">
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7h18M3 12h18M3 17h18"/></svg>
              <span>Chat</span>
            </Link>
          </li>
          <li>
            <Link href="#" className="flex items-center gap-3 rounded-md p-3 text-sm text-white/90 hover:bg-white/3 transition">
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v8m4-4H8"/></svg>
              <span>Projects</span>
            </Link>
          </li>
          <li>
            <Link href="#" className="flex items-center gap-3 rounded-md p-3 text-sm text-white/90 hover:bg-white/3 transition">
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"/></svg>
              <span>Collections</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="mt-auto">
        <button className="w-full rounded-md py-2 text-sm bg-gradient-to-b from-[#c9a84c] to-[#b58f3f] text-void font-medium shadow-md">New Chat</button>
        <div className="mt-3 text-xs text-white/60">&copy; Flux</div>
      </div>
    </aside>
  )
}
