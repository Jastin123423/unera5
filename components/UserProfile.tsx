
import React, { useState, useRef, useEffect } from 'react';
import { User, Post as PostType, ReactionType, Reel, AudioTrack } from '../types';
import { Post, CreatePostModal } from './Feed';

interface UserProfileProps {
    user: User;
    currentUser: User | null;
    users: User[];
    posts: PostType[];
    onProfileClick: (id: number) => void;
    onMessage: (id: number) => void;
    onViewImage: (url: string) => void;
    onOpenComments: (postId: number) => void;
    onPlayAudioTrack: (track: AudioTrack) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, currentUser, users, posts, onProfileClick, onMessage, onViewImage, onOpenComments, onPlayAudioTrack }) => {
    const [activeTab, setActiveTab] = useState('Posts');
    const [localUser, setLocalUser] = useState(user);
    const [showEditModal, setShowEditModal] = useState(false);
    
    const token = localStorage.getItem('unera_token');
    const isCurrentUser = currentUser && localUser.id === currentUser.id;
    const isAdmin = currentUser?.role === 'admin';

    const handleUpdateProfile = async (data: Partial<User>) => {
        const res = await fetch('/api/users/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            const updated = await res.json();
            setLocalUser(updated);
            setShowEditModal(false);
        }
    };

    const handleFollow = async () => {
        const res = await fetch(`/api/users/${localUser.id}/follow`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            // Re-fetch user to update follower counts
            const userRes = await fetch(`/api/users/${localUser.id}`);
            if (userRes.ok) setLocalUser(await userRes.json());
        }
    };

    const handleAdminAction = async (action: 'verify' | 'delete') => {
        const url = action === 'verify' ? `/api/users/${localUser.id}/verify` : `/api/users/${localUser.id}`;
        const res = await fetch(url, {
            method: action === 'verify' ? 'POST' : 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) window.location.reload();
    };

    const userPosts = posts.filter(p => p.user_id === localUser.id);

    return (
        <div className="w-full bg-[#18191A] min-h-screen">
            <div className="bg-[#242526] shadow-sm">
                <div className="max-w-[1095px] mx-auto w-full relative">
                    <div className="h-[200px] md:h-[350px] w-full bg-gray-700 relative overflow-hidden md:rounded-b-xl">
                        <img src={localUser.cover_image_url || 'https://via.placeholder.com/1500x500'} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="px-4">
                        <div className="flex flex-col md:flex-row items-center md:items-end -mt-20 gap-6 mb-4">
                            <img src={localUser.profile_image_url} className="w-40 h-40 rounded-full border-4 border-[#242526] bg-[#242526] object-cover" alt="" />
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                                    {localUser.name || localUser.username}
                                    {localUser.is_verified && <i className="fas fa-check-circle text-[#1877F2] text-xl"></i>}
                                </h1>
                                <p className="text-[#B0B3B8] font-bold">{localUser.followers.length} Followers</p>
                            </div>
                            <div className="flex gap-2 mb-4">
                                {isCurrentUser ? (
                                    <button onClick={() => setShowEditModal(true)} className="bg-[#3A3B3C] text-white px-6 py-2 rounded-lg font-bold">Edit Profile</button>
                                ) : (
                                    <>
                                        <button onClick={handleFollow} className="bg-[#1877F2] text-white px-8 py-2 rounded-lg font-bold">Follow</button>
                                        <button onClick={() => onMessage(localUser.id)} className="bg-[#3A3B3C] text-white px-6 py-2 rounded-lg font-bold">Message</button>
                                    </>
                                )}
                            </div>
                        </div>
                        {isAdmin && !isCurrentUser && (
                            <div className="flex gap-2 mb-4 p-2 bg-red-900/10 rounded-lg border border-red-900/20">
                                <button onClick={() => handleAdminAction('verify')} className="text-xs bg-[#263951] text-[#2D88FF] px-3 py-1 rounded font-bold">Verify</button>
                                <button onClick={() => handleAdminAction('delete')} className="text-xs bg-red-900/50 text-white px-3 py-1 rounded font-bold">Delete</button>
                            </div>
                        )}
                        <div className="flex gap-6 border-t border-[#3E4042] pt-2">
                            {['Posts', 'About', 'Photos'].map(t => (
                                <button key={t} onClick={() => setActiveTab(t)} className={`font-bold pb-2 ${activeTab === t ? 'text-[#1877F2] border-b-2 border-[#1877F2]' : 'text-[#B0B3B8]'}`}>{t}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[700px] mx-auto p-4">
                {activeTab === 'Posts' && (
                    <div className="space-y-4">
                        {userPosts.map(p => (
                            <Post key={p.id} post={p} author={localUser} currentUser={currentUser} onProfileClick={onProfileClick} onReact={() => {}} onShare={() => {}} onOpenComments={onOpenComments} onViewImage={onViewImage} onVideoClick={() => {}} onPlayAudioTrack={onPlayAudioTrack} />
                        ))}
                    </div>
                )}
                {activeTab === 'About' && (
                    <div className="bg-[#242526] p-6 rounded-xl border border-[#3E4042] text-white">
                        <h2 className="text-xl font-bold mb-4">About</h2>
                        <div className="space-y-4 text-[#B0B3B8]">
                            <p><i className="fas fa-map-marker-alt w-6"></i> Lives in {localUser.location || 'Unknown'}</p>
                            <p><i className="fas fa-briefcase w-6"></i> Works at {localUser.work || 'No work info'}</p>
                            <p><i className="fas fa-graduation-cap w-6"></i> Studied at {localUser.education || 'No education info'}</p>
                        </div>
                    </div>
                )}
            </div>

            {showEditModal && (
                <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#242526] w-full max-w-md rounded-xl p-6 border border-[#3E4042]">
                        <h2 className="text-xl font-bold text-white mb-6">Edit Details</h2>
                        <div className="space-y-4">
                            <input id="edit-location" className="w-full bg-[#3A3B3C] p-3 rounded-lg text-white" placeholder="Location" defaultValue={localUser.location} />
                            <input id="edit-work" className="w-full bg-[#3A3B3C] p-3 rounded-lg text-white" placeholder="Work" defaultValue={localUser.work} />
                            <button 
                                onClick={() => handleUpdateProfile({ 
                                    location: (document.getElementById('edit-location') as HTMLInputElement).value,
                                    work: (document.getElementById('edit-work') as HTMLInputElement).value
                                })}
                                className="w-full bg-[#1877F2] py-3 rounded-lg font-bold text-white"
                            >
                                Save Changes
                            </button>
                            <button onClick={() => setShowEditModal(false)} className="w-full text-[#B0B3B8]">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
