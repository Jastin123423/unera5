
import React, { useState, useEffect, useMemo } from 'react';
import { User, Event, Group, Product, Post as PostType, AudioTrack } from '../types';
import { MARKETPLACE_COUNTRIES } from '../constants';
import { Post } from './Feed';

// --- SUGGESTED PROFILES PAGE ---
interface SuggestedProfilesPageProps {
    currentUser: User;
    onProfileClick: (id: number) => void;
}

export const SuggestedProfilesPage: React.FC<SuggestedProfilesPageProps> = ({ currentUser, onProfileClick }) => {
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const token = localStorage.getItem('unera_token');

    const fetchSuggestions = async () => {
        setIsLoading(true);
        try {
            // In a real app, backend would return users not followed by current user
            const res = await fetch('/api/users'); 
            if (res.ok) {
                const data: User[] = await res.json();
                setSuggestions(data.filter(u => u.id !== currentUser.id && !currentUser.following.includes(u.id)));
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchSuggestions(); }, []);

    const handleFollow = async (id: number) => {
        const res = await fetch(`/api/users/${id}/follow`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchSuggestions();
    };

    return (
        <div className="w-full max-w-[700px] mx-auto p-4 font-sans pb-20">
            <h2 className="text-2xl font-bold text-[#E4E6EB] mb-4">Discover People</h2>
            {isLoading ? <div className="text-[#B0B3B8]">Finding new connections...</div> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    {suggestions.map((user) => (
                        <div key={user.id} className="bg-[#242526] rounded-xl border border-[#3E4042] overflow-hidden flex flex-col shadow-sm">
                            <div className="h-24 bg-gradient-to-r from-blue-900 to-slate-900 relative">
                                 {user.cover_image_url && <img src={user.cover_image_url} className="w-full h-full object-cover opacity-60" alt="" />}
                                 <div className="absolute -bottom-8 left-4">
                                     <img src={user.profile_image_url} className="w-16 h-16 rounded-full border-4 border-[#242526] object-cover bg-[#242526]" alt="" />
                                 </div>
                            </div>
                            <div className="pt-10 px-4 pb-4 flex-1 flex flex-col">
                                <h3 onClick={() => onProfileClick(user.id)} className="text-[#E4E6EB] font-bold text-lg hover:underline cursor-pointer">{user.username}</h3>
                                <p className="text-[#B0B3B8] text-sm mb-4 line-clamp-2">{user.bio || 'New to UNERA!'}</p>
                                <button onClick={() => handleFollow(user.id)} className="mt-auto w-full bg-[#1877F2] text-white py-2 rounded-lg font-bold">Follow</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- EVENTS PAGE ---
interface EventsPageProps { 
    currentUser: User; 
    onCreateEventClick: () => void;
    onProfileClick: (id: number) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ currentUser, onCreateEventClick, onProfileClick }) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const token = localStorage.getItem('unera_token');

    const fetchEvents = async () => {
        setIsLoading(true);
        const res = await fetch('/api/events');
        if (res.ok) setEvents(await res.json());
        setIsLoading(false);
    };

    useEffect(() => { fetchEvents(); }, []);

    const handleJoinEvent = async (eventId: number) => {
        if (!token) return alert("Login to join");
        const res = await fetch(`/api/events/${eventId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchEvents();
    };

    return (
        <div className="w-full max-w-[1000px] mx-auto p-4 md:p-6 font-sans pb-24 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 bg-[#242526] p-8 rounded-3xl border border-[#3E4042]">
                <div>
                    <h1 className="text-4xl font-black text-white mb-2">Events</h1>
                    <p className="text-[#B0B3B8]">Discover what's happening around you.</p>
                </div>
                <button onClick={onCreateEventClick} className="bg-[#1877F2] text-white px-8 py-3 rounded-xl font-bold">Host New Event</button>
            </div>

            {isLoading ? <div className="text-center py-20 text-[#B0B3B8]">Loading events...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.map(ev => (
                        <div key={ev.id} className="bg-[#242526] rounded-2xl overflow-hidden border border-[#3E4042]">
                            <img src={ev.cover_url} className="w-full h-48 object-cover" alt="" />
                            <div className="p-5">
                                <div className="text-red-500 font-bold text-sm mb-1">{new Date(ev.event_date).toDateString()}</div>
                                <h3 className="text-xl font-bold text-white mb-2">{ev.title}</h3>
                                <p className="text-[#B0B3B8] text-sm mb-4 line-clamp-2">{ev.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#B0B3B8]">{ev.attendees.length} attending</span>
                                    <button onClick={() => handleJoinEvent(ev.id)} className={`px-4 py-1.5 rounded-lg font-bold ${ev.attendees.includes(currentUser.id) ? 'bg-[#3A3B3C] text-white' : 'bg-[#1877F2] text-white'}`}>
                                        {ev.attendees.includes(currentUser.id) ? 'Going' : 'Interested'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- MEMORIES PAGE ---
interface MemoriesPageProps {
    currentUser: User;
    onProfileClick: (id: number) => void;
    onOpenComments: (postId: number) => void;
    onViewImage: (url: string) => void;
}

export const MemoriesPage: React.FC<MemoriesPageProps> = ({ currentUser, onProfileClick, onOpenComments, onViewImage }) => {
    const [memories, setMemories] = useState<PostType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const token = localStorage.getItem('unera_token');

    useEffect(() => {
        const fetchMemories = async () => {
            const res = await fetch(`/api/posts?user_id=${currentUser.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setMemories(await res.json());
            setIsLoading(false);
        };
        fetchMemories();
    }, [currentUser.id]);

    return (
        <div className="w-full max-w-[800px] mx-auto pb-24 font-sans animate-fade-in px-4">
            <div className="bg-gradient-to-br from-[#1877F2] to-[#6366F1] p-10 rounded-b-3xl text-center mb-8">
                <i className="fas fa-history text-white text-5xl mb-4"></i>
                <h1 className="text-3xl font-black text-white">Your Memories</h1>
                <p className="text-white/80">Relive your moments from the past.</p>
            </div>
            
            <div className="space-y-6">
                {isLoading ? <div className="text-center text-[#B0B3B8]">Retrieving your vault...</div> : memories.map(post => (
                    <Post 
                        key={post.id} 
                        post={post} 
                        author={currentUser} 
                        currentUser={currentUser} 
                        onProfileClick={onProfileClick} 
                        onReact={() => {}} 
                        onShare={() => {}} 
                        onViewImage={onViewImage} 
                        onOpenComments={onOpenComments} 
                        onVideoClick={() => {}} 
                    />
                ))}
            </div>
        </div>
    );
};

// --- SETTINGS PAGE ---
export const SettingsPage: React.FC<{ currentUser: User | null, onUpdateUser: (data: Partial<User>) => void }> = ({ currentUser, onUpdateUser }) => {
    const [activeSection, setActiveSection] = useState<'main' | 'details'>('main');
    const [name, setName] = useState(currentUser?.name || '');
    const [bio, setBio] = useState(currentUser?.bio || '');

    const handleSave = async () => {
        const token = localStorage.getItem('unera_token');
        const res = await fetch('/api/users/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name, bio })
        });
        if (res.ok) {
            onUpdateUser({ name, bio });
            setActiveSection('main');
        }
    };

    if (!currentUser) return null;

    return (
        <div className="w-full max-w-[600px] mx-auto p-4 text-[#E4E6EB] animate-fade-in pb-20">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            {activeSection === 'main' ? (
                <div className="bg-[#242526] rounded-xl border border-[#3E4042] overflow-hidden">
                    <div onClick={() => setActiveSection('details')} className="p-4 hover:bg-[#3A3B3C] cursor-pointer flex justify-between items-center">
                        <div>
                            <p className="font-bold">Personal Information</p>
                            <p className="text-xs text-[#B0B3B8]">Update your name and bio</p>
                        </div>
                        <i className="fas fa-chevron-right text-[#B0B3B8]"></i>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <button onClick={() => setActiveSection('main')} className="text-[#1877F2] font-bold mb-4"><i className="fas fa-arrow-left"></i> Back</button>
                    <input className="w-full bg-[#3A3B3C] p-3 rounded-lg text-white" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
                    <textarea className="w-full bg-[#3A3B3C] p-3 rounded-lg text-white" value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" />
                    <button onClick={handleSave} className="w-full bg-[#1877F2] py-3 rounded-lg font-bold">Save Changes</button>
                </div>
            )}
        </div>
    );
};

export const BirthdaysPage: React.FC<{ currentUser: User, users: User[], onMessage: (id: number) => void, onProfileClick: (id: number) => void }> = ({ currentUser, users, onMessage, onProfileClick }) => {
    return <div className="p-4 text-white">Birthday integration uses the Global User List.</div>;
};
