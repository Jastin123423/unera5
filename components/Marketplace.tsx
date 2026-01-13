
import React, { useState, useEffect, useRef } from 'react';
import { User, Product } from '../types';
import { MARKETPLACE_CATEGORIES, MARKETPLACE_COUNTRIES } from '../constants';

interface MarketplacePageProps {
    currentUser: User | null;
    authToken: string | null;
    onNavigateHome: () => void;
    onViewProduct: (product: Product) => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ currentUser, authToken, onNavigateHome, onViewProduct }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSellModal, setShowSellModal] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [desc, setDesc] = useState('');
    const [mainPrice, setMainPrice] = useState('');
    const [address, setAddress] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const fetchProducts = async () => {
        setIsLoading(true);
        const res = await fetch('/api/products');
        if (res.ok) setProducts(await res.json());
        setIsLoading(false);
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authToken) return;
        
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({
                title, category, description: desc, 
                country: 'TZ', address, 
                mainPrice: parseFloat(mainPrice), 
                quantity: 1, phoneNumber: currentUser?.phone || '000',
                images: [imageUrl || 'https://via.placeholder.com/300']
            })
        });

        if (res.ok) {
            setShowSellModal(false);
            fetchProducts();
        } else {
            const err = await res.json();
            alert(err.error || "Failed to create listing");
        }
    };

    return (
        <div className="min-h-screen bg-[#18191A] font-sans pb-20">
            <div className="bg-[#242526] sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-[#3E4042]">
                <div className="flex items-center gap-3 cursor-pointer" onClick={onNavigateHome}>
                    <i className="fas fa-arrow-left text-white"></i>
                    <h1 className="text-xl font-bold text-white">Marketplace</h1>
                </div>
                <button onClick={() => setShowSellModal(true)} className="bg-[#1877F2] text-white px-6 py-2 rounded-full font-bold">Sell Item</button>
            </div>

            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {isLoading ? <div>Loading Marketplace...</div> : products.map(p => (
                    <div key={p.id} className="bg-[#242526] rounded-xl overflow-hidden cursor-pointer border border-[#3E4042] group" onClick={() => onViewProduct(p)}>
                        <div className="aspect-square bg-white"><img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" /></div>
                        <div className="p-3">
                            <h3 className="text-white font-bold truncate">{p.title}</h3>
                            <p className="text-[#F02849] font-black">{p.main_price} TZS</p>
                        </div>
                    </div>
                ))}
            </div>

            {showSellModal && (
                <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4">
                    <div className="bg-[#242526] w-full max-w-lg rounded-2xl p-6 border border-[#3E4042]">
                        <h2 className="text-2xl font-bold text-white mb-6">List an Item</h2>
                        <form onSubmit={handleCreateProduct} className="space-y-4">
                            <input className="w-full bg-[#3A3B3C] p-3 rounded-lg text-white" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
                            <select className="w-full bg-[#3A3B3C] p-3 rounded-lg text-white" value={category} onChange={e => setCategory(e.target.value)} required>
                                <option value="">Select Category</option>
                                {MARKETPLACE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input className="w-full bg-[#3A3B3C] p-3 rounded-lg text-white" placeholder="Price" type="number" value={mainPrice} onChange={e => setMainPrice(e.target.value)} required />
                            <input className="w-full bg-[#3A3B3C] p-3 rounded-lg text-white" placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} required />
                            <textarea className="w-full bg-[#3A3B3C] p-3 rounded-lg text-white h-32" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} required />
                            <button type="submit" className="w-full bg-[#1877F2] py-3 rounded-lg font-bold text-white">List Product</button>
                            <button type="button" onClick={() => setShowSellModal(false)} className="w-full text-[#B0B3B8] font-bold py-2">Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// @google/genai-api-fix: Added ProductDetailModal component to fix import error in App.tsx
interface ProductDetailModalProps {
    product: Product;
    onClose: () => void;
    currentUser: User | null;
    onMessage?: (sellerId: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, currentUser, onMessage }) => {
    const [activeImage, setActiveImage] = useState(0);

    return (
        <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-[#242526] w-full max-w-4xl rounded-2xl border border-[#3E4042] shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden animate-slide-up">
                <div className="absolute top-4 right-4 z-50">
                    <button onClick={onClose} className="w-10 h-10 bg-[#3A3B3C] rounded-full flex items-center justify-center text-white hover:bg-[#4E4F50] transition-colors shadow-lg">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                {/* Left: Images */}
                <div className="w-full md:w-3/5 bg-black flex flex-col relative h-[40vh] md:h-auto">
                    <div className="flex-1 flex items-center justify-center overflow-hidden">
                        <img src={product.images[activeImage]} alt={product.title} className="max-w-full max-h-full object-contain" />
                    </div>
                    {product.images.length > 1 && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto py-2">
                            {product.images.map((img, idx) => (
                                <img 
                                    key={idx} 
                                    src={img} 
                                    className={`w-12 h-12 object-cover rounded-lg cursor-pointer border-2 transition-all ${activeImage === idx ? 'border-[#1877F2] scale-110' : 'border-transparent opacity-60'}`}
                                    onClick={() => setActiveImage(idx)}
                                    alt=""
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="w-full md:w-2/5 p-6 overflow-y-auto bg-[#242526] border-l border-[#3E4042]">
                    <div className="mb-6">
                        <div className="text-[#1877F2] font-bold text-sm uppercase tracking-wider mb-1">{product.category}</div>
                        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">{product.title}</h2>
                        <div className="text-[28px] font-black text-[#F02849] mb-4">
                            {MARKETPLACE_COUNTRIES.find(c => c.code === product.country)?.symbol || '$'}{product.main_price.toLocaleString()}
                        </div>
                    </div>

                    <div className="space-y-6 mb-8">
                        <div className="bg-[#3A3B3C]/50 p-4 rounded-xl border border-[#3E4042]">
                            <h3 className="text-white font-bold mb-2">Seller Information</h3>
                            <div className="flex items-center gap-3">
                                <img src={product.seller_avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                                <div>
                                    <p className="text-white font-bold">{product.seller_name}</p>
                                    <p className="text-[#B0B3B8] text-sm">Joined {new Date(product.created_at).getFullYear()}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-white font-bold mb-2">Description</h3>
                            <p className="text-[#E4E6EB] text-base leading-relaxed whitespace-pre-wrap">{product.description}</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-[#B0B3B8]">
                                <i className="fas fa-location-dot w-5 text-center text-red-500"></i>
                                <span>{product.address}, {MARKETPLACE_COUNTRIES.find(c => c.code === product.country)?.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[#B0B3B8]">
                                <i className="fas fa-check-circle w-5 text-center text-[#45BD62]"></i>
                                <span>In stock ({product.quantity} available)</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mt-auto">
                        <button 
                            onClick={() => onMessage?.(product.seller_id)}
                            className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white py-3.5 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            <i className="fab fa-facebook-messenger text-xl"></i> Message Seller
                        </button>
                        <a 
                            href={`tel:${product.phone_number}`}
                            className="w-full bg-[#3A3B3C] hover:bg-[#4E4F50] text-[#E4E6EB] py-3.5 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all no-underline"
                        >
                            <i className="fas fa-phone-alt"></i> Call Seller
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
