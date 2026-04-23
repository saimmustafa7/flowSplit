"use client"
import React, { useState } from 'react'

export function Tabs({ tabs }: { tabs: { id: string, label: string, content: React.ReactNode }[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0].id)

  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="flex w-full overflow-x-auto hide-scrollbar border-b border-[var(--border)] sticky top-16 bg-[var(--bg-primary)] z-30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] py-4 px-2 text-center text-sm font-bold transition-all relative ${
              activeTab === tab.id ? 'text-accent' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent shadow-[0_-2px_10px_var(--accent-glow)] lg:mx-auto lg:max-w-[40px]" />
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 w-full flex flex-col pt-4 overflow-y-auto overflow-x-hidden">
        {tabs.find(t => t.id === activeTab)?.content}
      </div>
    </div>
  )
}
