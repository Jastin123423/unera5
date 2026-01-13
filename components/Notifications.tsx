
import React, { useState, useEffect } from 'react';
import { Notification, User } from '../types';

interface NotificationDropdownProps {
    users: User[];
    onNotificationClick: (n: Notification) => void;
    onMarkAllRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ users, onNotificationClick }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const token = localStorage.getItem('unera_token');

    const fetchNotifications = async () => {
        if (!token) return;
        const res = await fetch('/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setNotifications(await res.json());
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const handleMarkRead = async () => {
        await fetch('/api/notifications/read-all', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchNotifications();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <i className="fas fa-thumbs-up text-white text-xs"></i>;
            case 'comment': return <i className="fas fa-comment-alt text-white text-xs"></i>;
            case 'follow': return <i className="fas fa-user-plus text-white text-xs"></i>;
            default: return <i className="fas fa-bell text-white text-xs"></i>;
        }
    };

    return (
        <div className="absolute top-12 right-0 w-[360px] bg-[#242526] rounded-lg shadow-2xl border border-[#3E4042] z-50 max-h-[80vh] flex flex-col">
            <div className="p-4 flex justify-between items-center border-b border-[#3E4042]">
                <h3 className="text-xl font-bold text-white">Notifications</h3>
                <button onClick={handleMarkRead} className="text-[#1877F2] text-sm font-bold hover:underline">Mark all as read</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-[#B0B3B8]">No notifications yet.</div>
                ) : notifications.map(notif => {
                    const sender = users.find(u => u.id === notif.sender_id);
                    return (
                        <div key={notif.id} onClick={() => onNotificationClick(notif)} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${notif.is_read ? 'hover:bg-[#3A3B3C]' : 'bg-[#263951] hover:bg-[#2A3F5A]'}`}>
                            <div className="relative">
                                <img src={sender?.profile_image_url} className="w-12 h-12 rounded-full object-cover" alt="" />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1877F2] rounded-full flex items-center justify-center border-2 border-[#242526]">
                                    {getIcon(notif.type)}
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-white"><span className="font-bold">{sender?.username}</span> {notif.content}</p>
                                <span className="text-xs text-[#B0B3B8]">{new Date(notif.created_at).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
