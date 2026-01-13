
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, Conversation } from '../types';

interface ChatWindowProps {
    currentUser: User;
    recipient: User;
    onClose: () => void;
    isFullScreen?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, recipient, onClose, isFullScreen = true }) => {
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const token = localStorage.getItem('unera_token');

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    
    // Find or fetch the conversation ID first
    useEffect(() => {
        const syncConversation = async () => {
            if (!token) return;
            try {
                const res = await fetch('/api/conversations', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const conversations: any[] = await res.json();
                const existing = conversations.find(c => c.recipient_id === recipient.id);
                if (existing) setActiveConversationId(existing.id);
            } catch (err) {
                console.error("Conversation sync error", err);
            }
        };
        syncConversation();
    }, [recipient.id]);

    // Poll for messages in the active conversation
    useEffect(() => {
        if (!activeConversationId) return;

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setMessages(await res.json());
            } catch (err) {
                console.error("Message sync error", err);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [activeConversationId]);

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ recipient_id: recipient.id, text_content: inputText })
            });
            if (res.ok) {
                const newMsg = await res.json();
                if (!activeConversationId) setActiveConversationId(newMsg.conversation_id);
                setMessages(prev => [...prev, newMsg]);
                setInputText('');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col font-sans animate-fade-in">
            <div className="flex items-center justify-between px-3 py-2 bg-[#202c33] border-b border-[#3E4042] h-16">
                <div className="flex items-center gap-3">
                    <i className="fas fa-arrow-left text-[#E4E6EB] text-xl cursor-pointer mr-1" onClick={onClose}></i>
                    <div className="relative">
                        <img src={recipient.profile_image_url} alt={recipient.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        {recipient.is_online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#31A24C] rounded-full border-2 border-[#202c33]"></div>}
                    </div>
                    <div>
                        <h4 className="font-bold text-[#E4E6EB]">{recipient.name}</h4>
                        <span className="text-[12px] text-[#8696a0]">{recipient.is_online ? 'online' : 'offline'}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-[#0B141A]">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                            <div className={`max-w-[80%] px-3 py-1.5 rounded-lg text-[#E9EDEF] shadow-sm relative ${isMe ? 'bg-[#005c4b] rounded-tr-none' : 'bg-[#202c33] rounded-tl-none'}`}>
                                <span>{msg.text_content}</span>
                                <div className="text-[10px] text-[#8696a0] text-right mt-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-[#202c33] flex items-center gap-2">
                <input 
                    type="text" 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    placeholder="Type a message..." 
                    className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-[#d1d7db] outline-none" 
                />
                <button onClick={handleSubmit} className="bg-[#00a884] w-10 h-10 rounded-full flex items-center justify-center text-white">
                    <i className="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    );
};
