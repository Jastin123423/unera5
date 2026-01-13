
import React, { useState, useRef, useEffect } from 'react';
import { User, Reel, ReactionType, Song } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ReelsFeedProps {
    reels: Reel[];
    users: User[];
    currentUser: User | null;
    onProfileClick: (id: number) => void;
    onCreateReelClick: () => void;
    initialReelId?: number | null;
}

export const ReelsFeed: React.FC<ReelsFeedProps> = ({ reels: initialReels, users, currentUser, onProfileClick, onCreateReelClick, initialReelId }) => {
    const [reels, setReels] = useState<Reel[]>(initialReels);
    const [activeReelId, setActiveReelId] = useState<number | null>(initialReelId || null);
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState<number | null>(null);
    
    const token = localStorage.getItem('unera_token');

    useEffect(() => {
        const fetchReels = async () => {
            const res = await fetch('/api/reels');
            if (res.ok) setReels(await res.json());
        };
        fetchReels();
    }, []);

    const handleLike = async (id: number) => {
        if (!token) return alert("Please login");
        const res = await fetch(`/api/reels/${id}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            // Optimistic update
            setReels(prev => prev.map(r => r.id === id ? { ...r, reactions: r.reactions.length > 0 ? [] : [{user_id: currentUser!.id, type: 'love'}] } : r));
        }
    };

    const handlePostComment = async (e: React.FormEvent, reelId: number) => {
        e.preventDefault();
        if (!commentText.trim() || !token) return;
        const res = await fetch(`/api/reels/${reelId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text: commentText })
        });
        if (res.ok) {
            setCommentText('');
            const commentData = await res.json();
            setReels(prev => prev.map(r => r.id === reelId ? { ...r, comments: [...r.comments, commentData.comment] } : r));
        }
    };

    return (
        <div className="w-full h-[calc(100vh-56px)] bg-black flex justify-center overflow-hidden relative">
            <div className="w-full max-w-[450px] h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
                {reels.map(reel => {
                    const author = users.find(u => u.id === reel.user_id) || { name: 'Creator', profile_image_url: '' };
                    return (
                        <div key={reel.id} className="w-full h-full snap-start relative flex flex-col justify-center">
                            <video src={reel.video_url} className="w-full h-full object-cover" loop autoPlay muted />
                            
                            {/* Actions */}
                            <div className="absolute right-4 bottom-24 flex flex-col gap-6 text-white text-center">
                                <div className="cursor-pointer" onClick={() => handleLike(reel.id)}>
                                    <i className="fas fa-heart text-2xl mb-1"></i>
                                    <p className="text-xs font-bold">{reel.reactions.length}</p>
                                </div>
                                <div className="cursor-pointer" onClick={() => setShowComments(reel.id)}>
                                    <i className="fas fa-comment-dots text-2xl mb-1"></i>
                                    <p className="text-xs font-bold">{reel.comments.length}</p>
                                </div>
                                <div className="cursor-pointer">
                                    <i className="fas fa-share text-2xl mb-1"></i>
                                    <p className="text-xs font-bold">{reel.shares}</p>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="absolute bottom-4 left-4 right-16 text-white">
                                <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => onProfileClick(reel.user_id)}>
                                    <img src={author.profile_image_url} className="w-10 h-10 rounded-full border-2 border-white" alt="" />
                                    <span className="font-bold">{author.name}</span>
                                </div>
                                <p className="text-sm mb-2">{reel.caption}</p>
                                <div className="flex items-center gap-2 text-xs bg-black/20 w-fit px-2 py-1 rounded-full">
                                    <i className="fas fa-music"></i> <span>{reel.song_name}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create Button */}
            {currentUser && (
                <button onClick={onCreateReelClick} className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-[#FF0050] to-[#00F2EA] rounded-full flex items-center justify-center text-white text-2xl shadow-xl">
                    <i className="fas fa-plus"></i>
                </button>
            )}

            {/* Comments Overlay */}
            {showComments !== null && (
                <div className="absolute inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowComments(null)}>
                    <div className="bg-[#242526] w-full h-[60%] rounded-t-2xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white">Comments</h3>
                            <i className="fas fa-times cursor-pointer text-[#B0B3B8]" onClick={() => setShowComments(null)}></i>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                            {reels.find(r => r.id === showComments)?.comments.map((c, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="bg-[#3A3B3C] p-2 rounded-xl flex-1">
                                        <p className="text-white text-sm">{c.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={(e) => handlePostComment(e, showComments)} className="flex gap-2">
                            <input className="flex-1 bg-[#3A3B3C] rounded-full px-4 py-2 text-white outline-none" placeholder="Say something..." value={commentText} onChange={e => setCommentText(e.target.value)} />
                            <button className="text-[#1877F2] font-bold">Post</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export const CreateReelModal: React.FC<{ songs: Song[], onClose: () => void, onSubmit: (file: File, caption: string) => void }> = ({ onClose, onSubmit }) => {
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-4">
            <div className="bg-[#242526] w-full max-w-md rounded-2xl p-6 border border-[#3E4042]">
                <h2 className="text-2xl font-bold text-white mb-6">Create Reel</h2>
                <div 
                    className="w-full aspect-[9/16] bg-[#3A3B3C] rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-[#B0B3B8] mb-6 cursor-pointer overflow-hidden"
                    onClick={() => inputRef.current?.click()}
                >
                    {file ? (
                        <p className="text-white font-bold">{file.name}</p>
                    ) : (
                        <>
                            <i className="fas fa-video text-4xl text-[#B0B3B8] mb-2"></i>
                            <span className="text-[#B0B3B8]">Select Video</span>
                        </>
                    )}
                    <input type="file" ref={inputRef} className="hidden" accept="video/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
                <textarea className="w-full bg-[#3A3B3C] p-3 rounded-lg text-white mb-4 outline-none h-24" placeholder="Add a caption..." value={caption} onChange={e => setCaption(e.target.value)} />
                <button 
                    onClick={() => file && onSubmit(file, caption)}
                    className="w-full bg-gradient-to-r from-[#FF0050] to-[#00F2EA] py-3 rounded-lg font-bold text-white mb-2"
                >
                    Share Reel
                </button>
                <button onClick={onClose} className="w-full text-[#B0B3B8] font-bold">Cancel</button>
            </div>
        </div>
    );
};
