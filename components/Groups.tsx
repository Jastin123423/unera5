
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { User, Group, Event, GroupPost, Post as PostType, ReactionType, AudioTrack } from '../types';
import { Post } from './Feed';
import { LOCATIONS_DATA } from '../constants';
import { CreateEventModal } from './Events';

interface GroupsPageProps {
    currentUser: User | null;
    authToken: string | null;
    users: User[];
    onProfileClick: (id: number) => void;
    onOpenComments: (groupId: number, postId: number) => void;
    onPlayAudioTrack?: (track: AudioTrack) => void;
}

export const GroupsPage: React.FC<GroupsPageProps> = ({ currentUser, authToken, users, onProfileClick, onOpenComments, onPlayAudioTrack }) => {
    const [view, setView] = useState<'feed' | 'detail'>('feed');
    const [groups, setGroups] = useState<Group[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
    const [groupTab, setGroupTab] = useState<'Discussion' | 'About' | 'Members'>('Discussion');
    const [isLoading, setIsLoading] = useState(true);
    const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);

    const fetchGroups = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/groups');
            if (res.ok) setGroups(await res.json());
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGroupPosts = async (id: number) => {
        const res = await fetch(`/api/groups/${id}/posts`);
        if (res.ok) setGroupPosts(await res.json());
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleJoinGroup = async (id: number) => {
        if (!authToken) return alert("Please Login");
        const res = await fetch(`/api/groups/${id}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) fetchGroups();
    };

    const handleGroupClick = (group: Group) => {
        setActiveGroupId(group.id);
        fetchGroupPosts(group.id);
        setView('detail');
    };

    const activeGroup = groups.find(g => g.id === activeGroupId);

    if (view === 'feed' || !activeGroup) {
        return (
            <div className="w-full max-w-[1000px] mx-auto p-4 font-sans">
                <div className="mb-6"><h2 className="text-2xl font-bold text-white">Groups</h2><p className="text-[#B0B3B8]">Discover communities of interest.</p></div>
                {isLoading ? <div className="text-center py-10">Loading Groups...</div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map(g => (
                            <div key={g.id} className="bg-[#242526] rounded-xl overflow-hidden border border-[#3E4042] flex flex-col">
                                <img src={g.cover_image} className="h-32 object-cover" alt="" onClick={() => handleGroupClick(g)} />
                                <div className="p-4 flex-1 flex flex-col">
                                    <h4 className="font-bold text-[#E4E6EB] hover:underline cursor-pointer" onClick={() => handleGroupClick(g)}>{g.name}</h4>
                                    <p className="text-[#B0B3B8] text-sm mb-4 line-clamp-2">{g.description}</p>
                                    <button onClick={() => handleJoinGroup(g.id)} className="w-full bg-[#1877F2] text-white py-2 rounded-lg font-bold">
                                        Join Community
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full bg-[#18191A] min-h-screen">
            <div className="bg-[#242526] border-b border-[#3E4042]">
                <div className="max-w-[1100px] mx-auto">
                    <img src={activeGroup.cover_image} className="h-[200px] md:h-[350px] w-full object-cover" alt="" />
                    <div className="p-4">
                        <h1 className="text-3xl font-bold text-white mb-2">{activeGroup.name}</h1>
                        <div className="flex gap-4 border-t border-[#3E4042] mt-4 pt-2">
                            {['Discussion', 'About', 'Members'].map(t => (
                                <button key={t} onClick={() => setGroupTab(t as any)} className={`px-4 py-2 font-bold ${groupTab === t ? 'text-[#1877F2] border-b-2 border-[#1877F2]' : 'text-[#B0B3B8]'}`}>{t}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-[700px] mx-auto p-4">
                {groupTab === 'Discussion' && (
                    <div className="space-y-4">
                        {groupPosts.map(p => (
                            <Post 
                                key={p.id} 
                                post={p as any} 
                                author={users.find(u => u.id === p.user_id) || users[0]} 
                                currentUser={currentUser} 
                                onProfileClick={onProfileClick} 
                                onReact={() => {}} 
                                onShare={() => {}} 
                                onOpenComments={() => onOpenComments(activeGroup.id, p.id)} 
                                onViewImage={() => {}} 
                                onVideoClick={() => {}} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
