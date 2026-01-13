
import React, { useState, useEffect, useRef } from 'react';
import { Song, AudioTrack, User, Episode } from '../types';

interface MusicSystemProps {
    currentUser: User | null;
    authToken: string | null;
    onPlayTrack: (track: AudioTrack) => void;
    isPlaying: boolean;
    onTogglePlay: () => void;
    users: User[];
    onLoginRequest?: () => void;
}

export const MusicSystem: React.FC<MusicSystemProps> = ({ currentUser, authToken, onPlayTrack, isPlaying, onTogglePlay, onLoginRequest }) => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [podcasts, setPodcasts] = useState<any[]>([]);
    const [view, setView] = useState<'music' | 'podcast' | 'dashboard'>('music');
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [sRes, pRes] = await Promise.all([
                fetch('/api/songs'),
                fetch('/api/podcasts')
            ]);
            if (sRes.ok) setSongs(await sRes.json());
            if (pRes.ok) setPodcasts(await pRes.json());
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    return (
        <div className="bg-[#0A0A0A] min-h-screen text-white font-sans pb-20">
            <div className="sticky top-14 bg-[#0A0A0A] z-30 p-4 border-b border-[#222] flex gap-6 overflow-x-auto scrollbar-hide">
                <button onClick={() => setView('music')} className={`font-bold transition-colors whitespace-nowrap ${view === 'music' ? 'text-[#1877F2]' : 'text-gray-500 hover:text-gray-300'}`}>MUSIC</button>
                <button onClick={() => setView('podcast')} className={`font-bold transition-colors whitespace-nowrap ${view === 'podcast' ? 'text-[#1877F2]' : 'text-gray-500 hover:text-gray-300'}`}>PODCASTS</button>
                
                {/* Dashboard tab only visible for logged-in users */}
                {currentUser && (
                    <button onClick={() => setView('dashboard')} className={`font-bold transition-colors whitespace-nowrap ${view === 'dashboard' ? 'text-[#1877F2]' : 'text-gray-500 hover:text-gray-300'}`}>DASHBOARD</button>
                )}
            </div>

            <div className="p-4 space-y-6 max-w-[800px] mx-auto animate-fade-in">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-bold">Tuning in to UNERA Music...</p>
                    </div>
                ) : view === 'music' ? (
                    <>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h2 className="text-xl font-black">Trending Singles</h2>
                            {!currentUser && (
                                <button onClick={onLoginRequest} className="text-[#1877F2] text-sm font-bold hover:underline">Upload Yours</button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {songs.map(s => (
                                <div key={s.id} className="flex items-center gap-4 p-3 bg-[#111] hover:bg-[#1A1A1A] rounded-2xl cursor-pointer group transition-all border border-transparent hover:border-[#1877F2]/30 shadow-lg" onClick={() => onPlayTrack({ id: s.id, url: s.audio_url, title: s.title, artist: s.artist_name, cover: s.cover_image_url, type: 'music' })}>
                                    <div className="relative">
                                        <img src={s.cover_image_url} className="w-16 h-16 rounded-xl object-cover shadow-2xl" alt="" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                                            <i className="fas fa-play text-white text-xl"></i>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="font-bold truncate group-hover:text-[#1877F2] transition-colors">{s.title}</h4>
                                        <p className="text-gray-400 text-sm truncate">{s.artist_name}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[12px] text-gray-600 hidden sm:block">2.4k plays</span>
                                        <i className="fas fa-ellipsis-v text-gray-700 hover:text-white px-2"></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : view === 'podcast' ? (
                    <>
                        <h2 className="text-xl font-black px-1 mb-4">Discover Podcasts</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {podcasts.map(p => (
                                <div key={p.id} className="flex flex-col gap-3 p-4 bg-[#111] hover:bg-[#1A1A1A] rounded-2xl border border-white/5 transition-all cursor-pointer">
                                    <div className="flex gap-4">
                                        <img src={p.cover_url} className="w-20 h-20 rounded-xl object-cover shadow-xl" alt="" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-lg leading-tight mb-1">{p.title}</h4>
                                            <p className="text-[#1877F2] text-xs font-black uppercase tracking-widest">{p.category}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{p.description}</p>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                        <span className="text-xs text-gray-500">{p.followers} Listeners</span>
                                        <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors">Listen Now</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    /* Dashboard View - Only for Authenticated Users */
                    <div className="animate-slide-up-half text-center py-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#1877F2] to-[#6366F1] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                            <i className="fas fa-chart-line text-3xl text-white"></i>
                        </div>
                        <h1 className="text-3xl font-black mb-2">Creator Dashboard</h1>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg">Manage your uploads, view analytics, and grow your fanbase on UNERA.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                            <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-[#1877F2]/50 transition-all cursor-pointer group">
                                <div className="w-12 h-12 bg-[#1877F2]/20 text-[#1877F2] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-cloud-upload-alt text-xl"></i>
                                </div>
                                <h3 className="font-bold text-lg mb-1">Upload Music</h3>
                                <p className="text-gray-500 text-sm">Share your latest single or album with the community.</p>
                            </div>
                            <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-[#F3425F]/50 transition-all cursor-pointer group">
                                <div className="w-12 h-12 bg-[#F3425F]/20 text-[#F3425F] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-microphone text-xl"></i>
                                </div>
                                <h3 className="font-bold text-lg mb-1">New Podcast</h3>
                                <h3 className="font-bold text-lg mb-1">Podcast Episode</h3>
                                <p className="text-gray-500 text-sm">Upload a new episode for your subscribers.</p>
                            </div>
                        </div>

                        <div className="mt-12 bg-gradient-to-r from-[#1877F2]/10 to-transparent p-8 rounded-3xl border border-[#1877F2]/20">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-xl">Analytics Overview</h3>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Last 30 Days</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div><p className="text-gray-500 text-xs font-bold mb-1">TOTAL PLAYS</p><p className="text-2xl font-black">0</p></div>
                                <div><p className="text-gray-500 text-xs font-bold mb-1">DOWNLOADS</p><p className="text-2xl font-black">0</p></div>
                                <div><p className="text-gray-500 text-xs font-bold mb-1">REELS USE</p><p className="text-2xl font-black">0</p></div>
                                <div><p className="text-gray-500 text-xs font-bold mb-1">LIKES</p><p className="text-2xl font-black">0</p></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Guest Call to Action */}
            {!currentUser && (view === 'music' || view === 'podcast') && (
                <div className="mx-4 mt-8 p-6 bg-gradient-to-r from-[#1877F2] to-[#6366F1] rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl shadow-blue-900/20">
                    <div className="text-center md:text-left">
                        <h3 className="font-black text-xl mb-1">Are you an Artist?</h3>
                        <p className="text-white/80">Join UNERA today to upload your music and reach thousands of listeners.</p>
                    </div>
                    <button onClick={onLoginRequest} className="bg-white text-[#1877F2] px-8 py-3 rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all">Sign Up Now</button>
                </div>
            )}
        </div>
    );
};

export const GlobalAudioPlayer: React.FC<{ currentTrack: AudioTrack, isPlaying: boolean, onTogglePlay: () => void, onClose: () => void, [key: string]: any }> = ({ currentTrack, isPlaying, onTogglePlay, onClose }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.play();
            else audioRef.current.pause();
        }
    }, [isPlaying, currentTrack.url]);

    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#141414] border-t border-[#333] z-[160] flex items-center px-4 justify-between animate-slide-up shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <audio ref={audioRef} src={currentTrack.url} />
            <div className="flex items-center gap-3">
                <img src={currentTrack.cover} className="w-12 h-12 rounded-xl object-cover shadow-lg border border-white/10" alt="" />
                <div className="overflow-hidden">
                    <h4 className="text-white font-bold truncate max-w-[120px] sm:max-w-[200px]">{currentTrack.title}</h4>
                    <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={onTogglePlay} className="w-12 h-12 bg-[#1877F2] hover:bg-[#166FE5] transition-colors rounded-full text-white shadow-lg flex items-center justify-center">
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} ${!isPlaying ? 'ml-1' : ''} text-lg`}></i>
                </button>
                <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-2"><i className="fas fa-times text-xl"></i></button>
            </div>
        </div>
    );
};
