import React, { useState } from 'react';
import { Send } from 'lucide-react';
import PostCard from './PostCard';
import FileUpload from './FileUpload';
import EmojiPicker from './EmojiPicker';
import { usePostMutations } from '../hooks/useFetsConnect';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { postSchema } from '../lib/validators';
import { toast } from 'react-hot-toast';

interface FileAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
}

const Feed = ({ posts, isLoading, error, profile }) => {
  const queryClient = useQueryClient();
  const { addPost } = usePostMutations();
  const [newPostContent, setNewPostContent] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = newPostContent;
    const before = text.substring(0, start);
    const after = text.substring(end);

    setNewPostContent(before + emoji + after);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const handlePostSubmit = async () => {
    try {
      const validatedData = postSchema.parse({ content: newPostContent });
      if (!profile) return;

      await addPost({
        content: validatedData.content,
        author_id: profile.id,
        author: profile,
        attachments: attachments.length > 0 ? attachments : undefined
      } as any);

      setNewPostContent('');
      setAttachments([]);
      toast.success('Post created successfully!');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Error posting:', error);
        toast.error('Failed to post. Please try again.');
      }
    }
  };

  return (
    <div className="overflow-y-auto p-8">
      {/* Post Creator */}
      <div className="bg-white p-5 rounded-xl shadow-md border border-slate-200 mb-8">
        <textarea
          ref={textareaRef}
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder={`What's happening, ${profile?.full_name}?`}
          className="w-full p-2 border-none focus:ring-0 resize-none text-base text-slate-700 placeholder-slate-400"
          rows={3}
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
          <div className="flex gap-2">
            <FileUpload onFilesSelected={setAttachments} />
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
          <button
            onClick={handlePostSubmit}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all shadow-md disabled:bg-slate-300"
            disabled={!newPostContent.trim()}
          >
            Post
          </button>
        </div>
      </div>
      {/* Posts Feed */}
      {isLoading ? (
        <p className="text-center text-slate-500">Loading feed...</p>
      ) : error ? (
        <p className="text-center text-red-500">Error loading feed. Please try again later.</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserProfile={profile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
