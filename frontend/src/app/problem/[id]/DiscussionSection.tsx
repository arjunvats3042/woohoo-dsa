"use client";
import { useState, useEffect, useCallback } from "react";
import { commentAPI } from "@/lib/api";

interface Comment {
    id: string;
    problemId: string;
    userId: string;
    username: string;
    content: string;
    likes: number;
    createdAt: string;
}

interface DiscussionSectionProps {
    problemId: string;
}

export default function DiscussionSection({ problemId }: DiscussionSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

    // Fetch comments
    const fetchComments = useCallback(async () => {
        try {
            const res = await commentAPI.getAll(problemId);
            setComments(res.data);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        } finally {
            setLoading(false);
        }
    }, [problemId]);

    useEffect(() => {
        fetchComments();

        // Get current user from local storage (or context if available)
        // Adjust this based on how you store user info
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                // Ensure we handle both potential formats if id is stored differently
                setCurrentUser({ id: user.id || user._id });
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
    }, [fetchComments]);

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        setPosting(true);
        try {
            await commentAPI.create(problemId, newComment);
            setNewComment("");
            await fetchComments(); // Refresh list
        } catch (error) {
            console.error("Failed to post comment:", error);
            alert("Failed to post comment. Please try again.");
        } finally {
            setPosting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;
        try {
            await commentAPI.delete(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (error) {
            console.error("Failed to delete comment:", error);
            alert("Failed to delete comment.");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="p-6 text-[var(--text-muted)]">Loading discussions...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <div className="bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-md p-4">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ask a question or share your thought..."
                    className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-md p-3 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-cyan)] focus:outline-none resize-none min-h-[80px]"
                />
                <div className="flex justify-end mt-3">
                    <button
                        onClick={handlePostComment}
                        disabled={posting || !newComment.trim()}
                        className="px-4 py-2 bg-[var(--accent-cyan)] text-[var(--bg-primary)] text-sm font-semibold rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {posting ? "Posting..." : "Post Comment"}
                    </button>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 pb-8">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                        No comments yet. Be the first to start a discussion!
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-md p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[var(--accent-cyan)]/20 flex items-center justify-center text-[var(--accent-cyan)] text-xs font-bold">
                                        {comment.username ? comment.username[0].toUpperCase() : "?"}
                                    </div>
                                    <div>
                                        <span className="font-medium text-sm text-white block">{comment.username}</span>
                                        <span className="text-xs text-[var(--text-muted)]">{formatDate(comment.createdAt)}</span>
                                    </div>
                                </div>
                                {currentUser && (currentUser.id === comment.userId) && (
                                    <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="text-xs text-red-500 hover:text-red-400 opacity-60 hover:opacity-100 transition-all"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                            <div className="pl-10">
                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
