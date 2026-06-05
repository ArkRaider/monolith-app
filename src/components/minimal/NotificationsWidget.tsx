'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { Bell, X, Check, Trash2, UserPlus, Info } from 'lucide-react';
import { useNotifications } from '@/context/NotificationsContext';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '@/app/actions/friend-actions';
import { useNotification } from '@/context/NotificationContext';

export default function NotificationsWidget({ isScrolled = true }: { isScrolled?: boolean }) {
  const { user, isLoaded } = useUser();
  const { isOpen, closeNotifications } = useNotifications();
  const { theme } = useTheme();
  const { notify } = useNotification();
  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);

  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'SYSTEM'>('REQUESTS');
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [systemNotifications, setSystemNotifications] = useState([
    { id: '1', title: 'System Active', message: 'Minimal Environment initialized successfully.', time: 'Just now' },
  ]);

  useEffect(() => {
    const messages = [
      { title: 'Peer Joined', message: 'A colleague just entered the Chill Lounge.' },
      { title: 'Focus Milestone', message: 'Global Study Hall has reached maximum capacity.' },
      { title: 'Deep Work', message: 'Your current session has passed the 2-hour mark.' },
      { title: 'Copresence Alert', message: '3 friends are currently online in the Focus Interface.' },
    ];
    let count = 0;
    const interval = setInterval(() => {
      if (count < messages.length) {
        const newMessage = messages[count];
        setSystemNotifications(prev => [
          { id: Date.now().toString(), title: newMessage.title, message: newMessage.message, time: 'Just now' },
          ...prev.map(n => ({ ...n, time: 'Earlier today' }))
        ]);
        count++;
      }
    }, 12000); 
    return () => clearInterval(interval);
  }, []);
  // Fetch Friend Requests
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const requests = await getFriendRequests();
      setFriendRequests(requests);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'REQUESTS') {
      fetchRequests();
    }
  }, [isOpen, activeTab, fetchRequests]);

  const handleAcceptRequest = async (id: string) => {
    await acceptFriendRequest(id);
    await fetchRequests();
    notify('Friend request accepted', 'Success');
  };

  const handleRejectRequest = async (id: string) => {
    await rejectFriendRequest(id);
    await fetchRequests();
    notify('Friend request ignored', 'Success');
  };

  if (!isLoaded || !user) return null;

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  const minimalDashboardStyles = {
    '--color-surface': isDark ? 'rgba(23, 23, 23, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    '--color-surface-high': isDark ? 'rgba(38, 38, 38, 0.9)' : 'rgba(244, 244, 245, 0.9)',
    '--color-border': isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    '--color-foreground': isDark ? '#ffffff' : '#111111',
    '--color-secondary': isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    '--color-background': isDark ? 'rgba(10, 10, 10, 0.9)' : 'rgba(250, 250, 250, 0.9)',
    '--color-primary': isDark ? '#ffffff' : '#000000',
    '--color-primary-foreground': isDark ? '#000000' : '#ffffff',
    '--border-weight': '1px',
    '--ui-shadow': isDark ? '0 20px 50px rgba(0,0,0,0.85)' : '0 20px 50px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: '24px',
    color: 'var(--color-foreground)',
    background: 'var(--color-surface)',
    border: 'var(--border-weight) solid var(--color-border)',
    boxShadow: 'var(--ui-shadow)',
  } as React.CSSProperties;


  return (
    <div className={`fixed z-[200] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${
      isScrolled ? 'right-6 top-1/2 -translate-y-1/2' : 'top-20 right-6'
    }`}>
      <div
        className={`w-[340px] h-[500px] flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen 
            ? 'opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto' 
            : `opacity-0 scale-95 pointer-events-none absolute ${isScrolled ? 'translate-x-8 translate-y-0' : 'translate-x-0 -translate-y-8'}`
        }`}
        style={{
          ...minimalDashboardStyles,
          transformOrigin: isScrolled ? 'right center' : 'top right'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{
            background: 'var(--color-surface-high)',
            borderBottom: 'var(--border-weight) solid var(--color-border)',
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('REQUESTS')}
              className={`font-[family-name:var(--font-primary)] text-xs uppercase font-black tracking-widest transition-colors ${activeTab === 'REQUESTS' ? 'text-foreground' : 'text-secondary'}`}
            >
              REQUESTS {friendRequests.length > 0 && <span className="text-[9px] font-bold text-primary ml-1">({friendRequests.length})</span>}
            </button>
            <button
              onClick={() => setActiveTab('SYSTEM')}
              className={`font-[family-name:var(--font-primary)] text-xs uppercase font-black tracking-widest transition-colors ${activeTab === 'SYSTEM' ? 'text-foreground' : 'text-secondary'}`}
            >
              SYSTEM
            </button>
          </div>
          
          <button
            onClick={() => closeNotifications()}
            className="transition-colors"
            style={{ color: 'var(--color-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-foreground)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-secondary)')}
          >
            <X size={16} />
          </button>
        </div>

        {/* REQUESTS TAB */}
        {activeTab === 'REQUESTS' && (
          <div className="flex-1 overflow-y-auto">
            {loadingRequests ? (
              <div className="flex items-center justify-center h-full">
                <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest animate-pulse" style={{ color: 'var(--color-secondary)' }}>
                  Loading Requests...
                </span>
              </div>
            ) : friendRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--color-secondary)' }}>
                <UserPlus size={24} className="opacity-30" />
                <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest">No Pending Requests</span>
              </div>
            ) : friendRequests.map(req => (
              <div
                key={req.id}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-left"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ background: 'var(--color-background)', border: 'var(--border-weight) solid var(--color-border)' }}
                  >
                    {req.requester.avatarUrl
                      ? <img src={req.requester.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="font-[family-name:var(--font-primary)] text-[10px] font-black" style={{ color: 'var(--color-foreground)' }}>{initials(req.requester.displayName)}</span>
                    }
                  </div>
                  <div className="flex flex-col">
                    <span className="font-[family-name:var(--font-primary)] text-[10px] font-bold uppercase" style={{ color: 'var(--color-foreground)' }}>@{req.requester.handle}</span>
                    <span className="font-[family-name:var(--font-primary)] text-[9px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--color-secondary)' }}>wants to connect</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleAcceptRequest(req.id)} className="w-6 h-6 flex items-center justify-center bg-primary text-primary-foreground hover:opacity-80 transition-opacity">
                    <Check size={12} />
                  </button>
                  <button onClick={() => handleRejectRequest(req.id)} className="w-6 h-6 flex items-center justify-center bg-surface-high text-secondary border border-border hover:bg-border transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SYSTEM TAB */}
        {activeTab === 'SYSTEM' && (
          <div className="flex-1 overflow-y-auto">
            {systemNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--color-secondary)' }}>
                <Bell size={24} className="opacity-30" />
                <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest">No New Notifications</span>
              </div>
            ) : systemNotifications.map(notif => (
              <div
                key={notif.id}
                className="w-full flex items-start gap-3 px-4 py-4 transition-colors text-left"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <div className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }}>
                  <Info size={16} />
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-center w-full">
                    <span className="font-[family-name:var(--font-primary)] text-[10px] font-bold uppercase" style={{ color: 'var(--color-foreground)' }}>{notif.title}</span>
                    <span className="font-[family-name:var(--font-primary)] text-[8px] uppercase tracking-widest" style={{ color: 'var(--color-secondary)' }}>{notif.time}</span>
                  </div>
                  <p className="font-[family-name:var(--font-primary)] text-[10px] mt-1 leading-relaxed" style={{ color: 'var(--color-secondary)' }}>
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
