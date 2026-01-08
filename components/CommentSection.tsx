
import React, { useState } from 'react';
import { User, Comment } from '../types';

interface CommentSectionProps {
    itemId: string;
    comments: Comment[];
    currentUser: User | null;
    onAddComment: (text: string) => Promise<boolean>;
    onDeleteComment?: (comment: Comment) => Promise<boolean>;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
    itemId,
    comments,
    currentUser,
    onAddComment,
    onDeleteComment
}) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;

        setIsSubmitting(true);
        const success = await onAddComment(newComment);
        if (success) {
            setNewComment('');
        }
        setIsSubmitting(false);
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('hu-HU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="mt-6 space-y-4">
            <h3 className="text-lg font-serif text-gold-400 border-b border-white/10 pb-2">
                Hozzászólások ({comments.length})
            </h3>

            {/* Comment List */}
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {comments.length === 0 ? (
                    <div className="text-gray-500 text-sm italic text-center py-4">
                        Még nincsenek hozzászólások. Légy te az első!
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gold-600 flex items-center justify-center text-xs font-bold text-black overflow-hidden">
                                        {comment.userAvatar ? (
                                            <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
                                        ) : (
                                            comment.userName.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <span className="font-bold text-gray-200 text-sm">{comment.userName}</span>
                                </div>
                                <span className="text-xs text-gray-500">{formatDate(comment.date)}</span>
                            </div>
                            <div className="text-gray-300 text-sm whitespace-pre-wrap pl-8">
                                {comment.text}
                            </div>
                            {currentUser && (currentUser.id === comment.userId || currentUser.isAdmin) && onDeleteComment && (
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={() => onDeleteComment(comment)}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Törlés
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Input Form */}
            {currentUser ? (
                <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Írj egy hozzászólást..."
                        className="flex-1 bg-black/30 border border-white/20 rounded px-3 py-2 text-white focus:border-gold-500 focus:outline-none transition-colors"
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        className="bg-gold-600 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded transition-colors"
                    >
                        {isSubmitting ? 'Küldés...' : 'Küldés'}
                    </button>
                </form>
            ) : (
                <div className="text-center py-4 bg-white/5 rounded border border-white/10 text-gray-400 text-sm">
                    Jelentkezz be a hozzászóláshoz!
                </div>
            )}
        </div>
    );
};
