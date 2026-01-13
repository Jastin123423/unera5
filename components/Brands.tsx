
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { User, Brand, Post as PostType, Event, LinkPreview, AudioTrack } from '../types';
import { Post, CreatePostModal } from './Feed';
import { BRAND_CATEGORIES, LOCATIONS_DATA } from '../constants';
import { CreateEventModal } from './Events';

interface BrandsPageProps {
    currentUser: User | null;
    users: User[]; 
    onProfileClick: (id: number) => void;
    onOpenComments: (postId: number) => void;
    onPlayAudioTrack?: (track: AudioTrack) => void;
    initialBrandId?: number | null;
}

export const BrandsPage: React.FC<BrandsPageProps> = ({ 
    currentUser, users, onProfileClick, onOpenComments, initialBrandId, onPlayAudioTrack
}) => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [brands, setBrands] = useState<Brand[]>([]);
    const [brandPosts, setBrandPosts] = useState<PostType[]>([]);
    const [activeBrandId, setActiveBrandId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'Posts' | 'About' | 'Photos'>('Posts');
    const [searchQuery, setSearchQuery] = useState('');

    const token = localStorage.getItem('unera_token');

    const fetchBrands = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/brands');
            if (res.ok) {
                const data = await res.json();
                setBrands(data);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBrandPosts = async (brandId: number) => {
        // Assuming your backend handles filtering posts by brand_id
        const res = await fetch(`/api/posts?brand_id=${brandId}`);
        if (res.ok) setBrandPosts(await res.json());
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    useEffect(() => {
        if (initialBrandId) {
            setActiveBrandId(initialBrandId);
            setView('detail');
            fetchBrandPosts(initialBrandId);
        }
    }, [initialBrandId]);

    const handleCreateBrand = async (brandData: Partial<Brand>) => {
        const res = await fetch('/api/brands', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(brandData)
        });
        if (res.ok) {
            setShowCreateModal(false);
            fetchBrands();
        }
    };

    const handleFollowBrand = async (brandId: number) => {
        if (!token) return alert("Please login");
        const res = await fetch(`/api/users/${brandId}/follow`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchBrands();
    };

    const handleDeleteBrand = async (brandId: number) => {
        if (!window.confirm("Are you sure you want to delete this page?")) return;
        const res = await fetch(`/api/brands/${brandId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setView('list');
            fetchBrands();
        }
    };

    const handleBrandClick = (brandId: number) => {
        setActiveBrandId(brandId);
        fetchBrandPosts(brandId);
        setView('detail');
        setActiveTab('Posts');
        window.scrollTo(0, 0);
    };

    const activeBrand = brands.find(b => b.id === activeBrandId);

    if (view === 'list' || !activeBrand) {
        return (
            <div className="w-full max-w-[1000px] mx-auto p-4 font-sans pb-20">
                <div className="flex flex-col gap-4 mb-6 bg-[#242526] p-4 rounded-xl border border-[#3E4042]">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-[#E4E6EB]">Brands & Pages</h2>
                            <p className="text-[#B0B3B8] text-sm">Discover businesses and creators.</p>
                        </div>
                        {currentUser && (
                            <button onClick={() => setShowCreateModal(true)} className="bg-[#1877F2] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                <i className="fas fa-plus"></i> <span>Create Brand</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brands.map(brand => (
                        <div key={brand.id} className="bg-[#242526] rounded-xl overflow-hidden border border-[#3E4042] flex flex-col">
                            <img src={brand.cover_image_url} className="h-32 object-cover cursor-pointer" onClick={() => handleBrandClick(brand.id)} alt="" />
                            <div className="p-4 flex-1 flex flex-col relative pt-10">
                                <img src={brand.profile_image_url} className="absolute -top-8 left-4 w-16 h-16 rounded-full border-4 border-[#242526] object-cover bg-[#242526]" alt="" />
                                <h4 className="font-bold text-lg text-[#E4E6EB] hover:underline cursor-pointer" onClick={() => handleBrandClick(brand.id)}>{brand.name}</h4>
                                <p className="text-[#B0B3B8] text-sm mb-4 line-clamp-2">{brand.description}</p>
                                <button onClick={() => handleFollowBrand(brand.id)} className="w-full bg-[#3A3B3C] text-[#E4E6EB] font-bold py-2 rounded-lg transition-colors">
                                    Follow Page
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {showCreateModal && (
                    <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-[#242526] w-full max-w-[500px] rounded-xl border border-[#3E4042] shadow-2xl p-6">
                            <h3 className="text-xl font-bold text-white mb-6">Create a Brand</h3>
                            <div className="space-y-4">
                                <input id="brand-name" type="text" className="w-full bg-[#3A3B3C] rounded-lg p-3 text-white outline-none" placeholder="Brand Name" />
                                <select id="brand-category" className="w-full bg-[#3A3B3C] rounded-lg p-3 text-white outline-none">
                                    {BRAND_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <textarea id="brand-desc" className="w-full bg-[#3A3B3C] rounded-lg p-3 text-white h-24 outline-none" placeholder="Description" />
                                <button 
                                    onClick={() => {
                                        const name = (document.getElementById('brand-name') as HTMLInputElement).value;
                                        const category = (document.getElementById('brand-category') as HTMLSelectElement).value;
                                        const description = (document.getElementById('brand-desc') as HTMLTextAreaElement).value;
                                        if (name && category) handleCreateBrand({ name, category, description });
                                    }}
                                    className="w-full bg-[#1877F2] py-3 rounded-lg font-bold text-white"
                                >
                                    Create Brand
                                </button>
                                <button onClick={() => setShowCreateModal(false)} className="w-full text-[#B0B3B8] py-2">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full bg-[#18191A] min-h-screen pb-10">
            <div className="bg-[#242526] border-b border-[#3E4042] shadow-sm mb-4">
                <div className="max-w-[1100px] mx-auto">
                    <img src={activeBrand.cover_image_url} className="h-[200px] md:h-[350px] w-full object-cover" alt="" />
                    <div className="px-4 pb-4">
                        <div className="flex flex-col md:flex-row items-start md:items-end -mt-10 gap-4">
                            <img src={activeBrand.profile_image_url} className="w-32 h-32 rounded-full border-4 border-[#242526] object-cover" alt="" />
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-white flex items-center gap-2">{activeBrand.name}</h1>
                                <p className="text-[#B0B3B8] font-semibold">{activeBrand.category} • {activeBrand.location}</p>
                            </div>
                            <div className="flex gap-2 mb-2">
                                <button onClick={() => handleFollowBrand(activeBrand.id)} className="bg-[#1877F2] text-white px-8 py-2 rounded-lg font-bold">Follow</button>
                                {currentUser?.id === activeBrand.admin_id && (
                                    <button onClick={() => handleDeleteBrand(activeBrand.id)} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg font-bold"><i className="fas fa-trash"></i></button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-6 mt-4 border-t border-[#3E4042] pt-2">
                            {['Posts', 'About', 'Photos'].map(t => (
                                <button key={t} onClick={() => setActiveTab(t as any)} className={`font-bold pb-2 ${activeTab === t ? 'text-[#1877F2] border-b-2 border-[#1877F2]' : 'text-[#B0B3B8]'}`}>{t}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[700px] mx-auto p-4">
                {activeTab === 'Posts' && (
                    <div className="space-y-4">
                        {brandPosts.map(post => (
                            <Post 
                                key={post.id} 
                                post={post} 
                                author={activeBrand as any} 
                                currentUser={currentUser} 
                                onProfileClick={onProfileClick} 
                                onReact={() => {}} 
                                onShare={() => {}} 
                                onOpenComments={() => onOpenComments(post.id)} 
                                onViewImage={() => {}} 
                                onVideoClick={() => {}} 
                                onPlayAudioTrack={onPlayAudioTrack}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
