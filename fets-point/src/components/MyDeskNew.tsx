import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, FolderLock, Lightbulb } from 'lucide-react'
import FetsConnectNew from './FetsConnectNew'
import ResourceCentre from './ResourceCentre'
import Brainstorm from './Brainstorm'

export function MyDeskNew() {
  const [activeTab, setActiveTab] = useState<'connect' | 'resources' | 'brainstorm'>('connect')

  const tabs = [
    { id: 'connect' as const, label: 'FETS Connect', icon: MessageSquare },
    { id: 'resources' as const, label: 'Resource Centre', icon: FolderLock },
    { id: 'brainstorm' as const, label: 'Brainstorm', icon: Lightbulb }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header with Tabs */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-6">
          My Desk
        </h1>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-6 py-3 font-medium transition-all duration-200 flex items-center space-x-2 rounded-md
                  ${isActive
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }
                `}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'connect' && <FetsConnectNew />}
        {activeTab === 'resources' && <ResourceCentre />}
        {activeTab === 'brainstorm' && <Brainstorm />}
      </div>
    </div>
  )
}

export default MyDeskNew
