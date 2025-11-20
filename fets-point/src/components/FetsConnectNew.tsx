import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Image as ImageIcon,
  X,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Rocket,
  AlertCircle,
  Coffee,
  Trophy,
  Smile
} from 'lucide-react'
import { useSocialPosts, useCreatePost, useToggleLike, useAddComment, useDeletePost, useUploadImage, useCurrentUser } from '../hooks/useSocial'
// import { useCurrentUser } from '../hooks/useStaffManagement'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const FetsConnectNew: React.FC = () => {
  const { data: posts = [], isLoading } = useSocialPosts()
  const { data: currentUser } = useCurrentUser()
  const createPost = useCreatePost()
  const toggleLike = useToggleLike()
  const addComment = useAddComment()
  const deletePost = useDeletePost()
  const uploadImage = useUploadImage()

  const [postContent, setPostContent] = useState('')
  const [postType, setPostType] = useState<'ship_it' | 'blocker' | 'break' | 'kudos'>('ship_it')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const postTypes = [
    {
      id: 'ship_it',
      label: 'Ship It',
      icon: Rocket,
      color: 'bg-blue-50 text-blue-600',
      ring: 'ring-blue-400',
      placeholder: "What did you ship today? 🚀"
    },
    {
      id: 'blocker',
      label: 'Blocker',
      icon: AlertCircle,
      color: 'bg-red-50 text-red-600',
      ring: 'ring-red-400',
      placeholder: "What's blocking you? 🆘"
    },
    {
      id: 'break',
      label: 'Coffee Break',
      icon: Coffee,
      color: 'bg-amber-50 text-amber-600',
      ring: 'ring-amber-400',
      placeholder: "Time for a break? What's on your mind? ☕"
    },
    {
      id: 'kudos',
      label: 'Kudos',
      icon: Trophy,
      color: 'bg-yellow-50 text-yellow-600',
      ring: 'ring-yellow-400',
      placeholder: "Who deserves a shoutout? 🏆"
    }
  ] as const

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!postContent.trim() && !selectedImage) return

    try {
      let imageUrl = ''
      if (selectedImage) {
        imageUrl = await uploadImage.mutateAsync(selectedImage)
      }

      if (!currentUser) {
        toast.error('You must be logged in to post')
        return
      }

      await createPost.mutateAsync({
        content: postContent,
        post_type: postType,
        image_url: imageUrl,
        branch_location: currentUser?.location || 'global',
        user_id: currentUser.id
      })

      setPostContent('')
      setSelectedImage(null)
      setImagePreview(null)
      toast.success('Posted successfully!')
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error('Failed to create post')
    }
  }

  const getPostTypeStyles = (type: string) => {
    switch (type) {
      case 'ship_it': return { icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Shipped 🚀' }
      case 'blocker': return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Needs Help 🆘' }
      case 'break': return { icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Coffee Break ☕' }
      case 'kudos': return { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Kudos 🏆' }
      // Legacy support
      case 'discussion': return { icon: MessageCircle, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Discussion' }
      case 'question': return { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Question' }
      default: return { icon: MessageCircle, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Post' }
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Create Post Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex gap-4 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {postTypes.map((type) => {
            const Icon = type.icon
            const isSelected = postType === type.id
            return (
              <button
                key={type.id}
                onClick={() => setPostType(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${isSelected
                  ? `${type.color} ring-2 ring-offset-1 ${type.ring}`
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Icon size={16} />
                {type.label}
              </button>
            )
          })}
        </div>

        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
            {currentUser?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder={postTypes.find(t => t.id === postType)?.placeholder || `What's happening, ${currentUser?.full_name?.split(' ')[0] || 'there'}?`}
              className="w-full border-none resize-none focus:ring-0 text-gray-700 placeholder-gray-400 text-lg min-h-[80px] p-0"
            />

            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-lg object-cover border border-gray-200" />
                <button
                  onClick={() => {
                    setSelectedImage(null)
                    setImagePreview(null)
                  }}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:bg-gray-50"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                >
                  <ImageIcon size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors">
                  <Smile size={20} />
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={(!postContent.trim() && !selectedImage) || createPost.isPending}
                className="bg-amber-600 text-white px-6 py-2 rounded-full font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
              >
                {createPost.isPending ? 'Posting...' : (
                  <>
                    Send <Send size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto"></div>
          </div>
        ) : (
          <AnimatePresence>
            {posts.map((post) => {
              const typeStyle = getPostTypeStyles(post.post_type)
              const TypeIcon = typeStyle.icon
              const isLiked = post.likes?.some(like => like.user_id === currentUser?.id)

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold">
                          {post.user?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{post.user?.full_name || 'Unknown User'}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                            <span>•</span>
                            <span className={`flex items-center gap-1 ${typeStyle.color} bg-opacity-10 px-2 py-0.5 rounded-full bg-gray-100`}>
                              <TypeIcon size={12} />
                              {typeStyle.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      {currentUser?.id === post.user_id && (
                        <button
                          onClick={() => deletePost.mutate(post.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <MoreHorizontal size={20} />
                        </button>
                      )}
                    </div>

                    <p className="text-gray-800 whitespace-pre-wrap mb-4 text-base leading-relaxed">
                      {post.content}
                    </p>

                    {post.image_url && (
                      <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
                        <img src={post.image_url} alt="Post attachment" className="w-full h-auto max-h-[500px] object-cover" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex gap-6">
                        <button
                          onClick={() => {
                            if (!currentUser) {
                              toast.error('Please log in to like posts')
                              return
                            }
                            toggleLike.mutate({
                              post_id: post.id,
                              user_id: currentUser.id,
                              isLiked: !!isLiked
                            })
                          }}
                          className={`flex items-center gap-2 text-sm font-medium transition-colors ${isLiked ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'
                            }`}
                        >
                          <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                          <span>{post.likes?.length || 0}</span>
                        </button>
                        <button
                          onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-amber-600 transition-colors"
                        >
                          <MessageCircle size={20} />
                          <span>{post.comments?.length || 0}</span>
                        </button>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {expandedComments[post.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-50 border-t border-gray-100 p-4 sm:p-6"
                      >
                        <div className="space-y-4 mb-4">
                          {post.comments?.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                                {comment.user?.full_name?.charAt(0)}
                              </div>
                              <div className="flex-1 bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                                <div className="flex justify-between items-baseline mb-1">
                                  <span className="text-sm font-semibold text-gray-900">{comment.user?.full_name}</span>
                                  <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                            {currentUser?.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={commentTexts[post.id] || ''}
                              onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  if (commentTexts[post.id]?.trim() && currentUser) {
                                    addComment.mutate({
                                      post_id: post.id,
                                      user_id: currentUser.id,
                                      content: commentTexts[post.id]
                                    })
                                    setCommentTexts(prev => ({ ...prev, [post.id]: '' }))
                                  }
                                }
                              }}
                              placeholder="Write a comment..."
                              className="w-full rounded-full border-gray-200 pl-4 pr-12 py-2 text-sm focus:border-amber-500 focus:ring-amber-500"
                            />
                            <button
                              onClick={() => {
                                if (commentTexts[post.id]?.trim() && currentUser) {
                                  addComment.mutate({
                                    post_id: post.id,
                                    user_id: currentUser.id,
                                    content: commentTexts[post.id]
                                  })
                                  setCommentTexts(prev => ({ ...prev, [post.id]: '' }))
                                }
                              }}
                              disabled={!commentTexts[post.id]?.trim()}
                              className="absolute right-1 top-1 p-1.5 text-amber-600 hover:bg-amber-50 rounded-full disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                            >
                              <Send size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default FetsConnectNew
