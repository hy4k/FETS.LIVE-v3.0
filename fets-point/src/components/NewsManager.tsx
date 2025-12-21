import React, { useState } from 'react'
import { useNews, useNewsMutations } from '../hooks/useNewsManager'
import { Plus, Edit, Trash2, Bell, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

const NewsModal = ({ isOpen, onClose, newsItem, onSave }) => {
  const [formData, setFormData] = useState({
    content: newsItem?.content || '',
    priority: newsItem?.priority || 'normal',
    branch_location: newsItem?.branch_location || 'global',
    expires_at: newsItem?.expires_at ? format(new Date(newsItem.expires_at), 'yyyy-MM-dd') : '',
    is_active: newsItem?.is_active ?? true,
  })

  const handleSave = async () => {
    if (!formData.content.trim()) {
      toast.error('Content is required.')
      return
    }
    await onSave({ ...formData, id: newsItem?.id })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">{newsItem ? 'Edit News Item' : 'Create News Item'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Content *</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter news content..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Branch</label>
              <select
                value={formData.branch_location}
                onChange={e => setFormData({ ...formData, branch_location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="global">Global (All Branches)</option>
                <option value="calicut">Calicut</option>
                <option value="cochin">Cochin</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Expires At</label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={String(formData.is_active)}
                onChange={e => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="true">✅ Active</option>
                <option value="false">⭕ Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md font-semibold">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold">
            {newsItem ? 'Update Item' : 'Create Item'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function NewsManager() {
  const { data: newsItems = [], isLoading } = useNews()
  const { addNewsItem, updateNewsItem, deleteNewsItem } = useNewsMutations()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedNewsItem, setSelectedNewsItem] = useState(null)

  const openModal = (item = null) => {
    setSelectedNewsItem(item)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedNewsItem(null)
    setIsModalOpen(false)
  }

  const handleSave = async (itemData) => {
    if (itemData.id) {
      await updateNewsItem(itemData)
    } else {
      await addNewsItem(itemData)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">News Manager</h1>
          <p className="text-gray-600 mt-1">Create and manage announcements for the FETS News scroller.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create News</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Content</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Branch</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Expires At</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500">Loading news...</td></tr>
              ) : newsItems.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500">No news items found. Create your first news item!</td></tr>
              ) : newsItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 max-w-md">
                    <p className="text-sm text-gray-800 line-clamp-2">{item.content}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {item.is_active ? '✅ Active' : '⭕ Inactive'}
                    </span>
                    {item.priority === 'high' && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                        Urgent
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {item.branch_location}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.expires_at ? (
                      <span className="text-sm text-gray-700">{format(new Date(item.expires_at), 'dd MMM yyyy')}</span>
                    ) : (
                      <span className="text-sm text-gray-400">No expiry</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModal(item)} className="p-2 hover:bg-gray-100 rounded-md transition-colors"><Edit className="w-4 h-4 text-gray-600" /></button>
                      <button onClick={() => deleteNewsItem(item.id)} className="p-2 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4 text-red-600" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <NewsModal
            isOpen={isModalOpen}
            onClose={closeModal}
            newsItem={selectedNewsItem}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default NewsManager