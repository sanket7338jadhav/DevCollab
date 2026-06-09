import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Search, MessageSquare, Circle, ChevronLeft, Loader } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageAPI, userAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { user, socket, onlineUsers } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [convoLoading, setConvoLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Load conversations and users
  useEffect(() => {
    const init = async () => {
      setConvoLoading(true);
      try {
        const [convos, users] = await Promise.all([
          messageAPI.getConversations(),
          userAPI.getAll(),
        ]);
        setConversations(convos);
        setAllUsers(users);
      } catch (err) {
        console.error(err);
      } finally {
        setConvoLoading(false);
      }
    };
    init();
  }, []);

  // Auto-select user from URL param
  useEffect(() => {
    if (paramUserId && allUsers.length > 0) {
      const found = allUsers.find(u => u._id === paramUserId);
      if (found) openConversation(found);
    }
  }, [paramUserId, allUsers]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      if (
        msg.sender._id === activeUser?._id ||
        msg.receiver._id === activeUser?._id
      ) {
        setMessages(prev => [...prev, msg]);
      }
      // Update conversations list
      setConversations(prev => {
        const exists = prev.find(c => c.conversationId === msg.conversationId);
        if (exists) {
          return prev.map(c =>
            c.conversationId === msg.conversationId
              ? { ...c, lastMessage: msg }
              : c
          );
        }
        return prev;
      });
    };

    const handleSent = (msg) => {
      setMessages(prev => [...prev, msg]);
      setSending(false);
    };

    const handleTyping = (data) => {
      if (data.senderId === activeUser?._id) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    };

    const handleStopTyping = (data) => {
      if (data.senderId === activeUser?._id) setIsTyping(false);
    };

    socket.on('receive_message', handleReceive);
    socket.on('message_sent', handleSent);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('message_sent', handleSent);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [socket, activeUser]);

  const openConversation = async (targetUser) => {
    setActiveUser(targetUser);
    setLoading(true);
    setText('');
    setIsTyping(false);
    try {
      const msgs = await messageAPI.getMessages(targetUser._id);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!text.trim() || !activeUser || !socket || sending) return;

    setSending(true);
    socket.emit('send_message', { receiverId: activeUser._id, text: text.trim() });
    setText('');

    // Stop typing
    socket.emit('stop_typing', { receiverId: activeUser._id });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !activeUser) return;
    socket.emit('typing', { receiverId: activeUser._id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { receiverId: activeUser._id });
    }, 1500);
  };

  const isOnline = (userId) => onlineUsers.includes(userId);

  // Build sidebar contact list: conversations + all users (deduped)
  const contactList = (() => {
    const convUsers = conversations
      .map(c => ({ ...c.otherUser, lastMessage: c.lastMessage, unread: c.unreadCount }))
      .filter(Boolean);

    const convUserIds = new Set(convUsers.map(u => u._id));
    const otherUsers = allUsers.filter(u => !convUserIds.has(u._id));

    const all = [...convUsers, ...otherUsers];
    if (!searchQuery) return all;
    return all.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  })();

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      height: 'calc(100vh - 64px)',
      display: 'flex',
      background: 'var(--background)',
      overflow: 'hidden',
    }}>
      {/* ── Sidebar ── */}
      <div style={{
        width: '320px',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.75rem' }}>Messages</h2>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} size={16} />
            <input
              type="text"
              className="form-control"
              placeholder="Search users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convoLoading ? (
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
              <Loader size={24} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : contactList.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.875rem' }}>No users found</p>
            </div>
          ) : (
            contactList.map(contact => (
              <motion.div
                key={contact._id}
                whileHover={{ background: 'rgba(147,51,234,0.05)' }}
                onClick={() => openConversation(contact)}
                style={{
                  padding: '0.85rem 1.25rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: activeUser?._id === contact._id ? 'rgba(147,51,234,0.07)' : 'transparent',
                  transition: 'background 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: `hsl(${contact.name?.charCodeAt(0) * 15 || 0}, 65%, 55%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '1rem',
                  }}>
                    {contact.name?.charAt(0).toUpperCase()}
                  </div>
                  {isOnline(contact._id) && (
                    <Circle
                      size={11}
                      fill="#22c55e"
                      color="#22c55e"
                      style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--surface)', borderRadius: '50%' }}
                    />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', truncate: true }}>
                      {contact.name}
                    </p>
                    {contact.unread > 0 && (
                      <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-full)', minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, padding: '0 4px' }}>
                        {contact.unread}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {isOnline(contact._id) ? '🟢 Online' : contact.lastMessage?.text?.slice(0, 40) || contact.email}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      {activeUser ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'var(--surface)',
          }}>
            <button
              onClick={() => setActiveUser(null)}
              style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
            >
              <ChevronLeft size={22} />
            </button>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: `hsl(${activeUser.name?.charCodeAt(0) * 15 || 0}, 65%, 55%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
            }}>
              {activeUser.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>{activeUser.name}</p>
              <p style={{ fontSize: '0.78rem', color: isOnline(activeUser._id) ? '#22c55e' : 'var(--text-muted)', fontWeight: 500 }}>
                {isOnline(activeUser._id) ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem' }}>
                <Loader size={28} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
                <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p style={{ fontWeight: 500 }}>Start a conversation with {activeUser.name}</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => {
                  const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                  return (
                    <motion.div
                      key={msg._id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex',
                        justifyContent: isMine ? 'flex-end' : 'flex-start',
                        gap: '0.5rem',
                        alignItems: 'flex-end',
                      }}
                    >
                      {!isMine && (
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: `hsl(${activeUser.name?.charCodeAt(0) * 15 || 0}, 65%, 55%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0,
                        }}>
                          {activeUser.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{
                        maxWidth: '65%', padding: '0.7rem 1rem',
                        borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isMine ? 'var(--primary)' : 'var(--surface)',
                        color: isMine ? 'white' : 'var(--text-main)',
                        border: isMine ? 'none' : '1px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                        wordBreak: 'break-word',
                      }}>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{msg.text}</p>
                        <p style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '0.3rem', textAlign: 'right' }}>
                          {msg.createdAt ? formatTime(msg.createdAt) : ''}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <div style={{
                    padding: '0.6rem 1rem', background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px',
                    display: 'flex', gap: '4px', alignItems: 'center'
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)',
                        animation: `bounce 1s ${i * 0.15}s ease-in-out infinite`
                      }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-end',
          }}>
            <textarea
              value={text}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeUser.name}...`}
              rows={1}
              style={{
                flex: 1, padding: '0.75rem 1rem',
                background: 'var(--background)', color: 'var(--text-main)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem', resize: 'none', fontFamily: 'inherit',
                maxHeight: '120px', lineHeight: 1.5,
                transition: 'border-color 0.2s',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!text.trim() || sending}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: text.trim() ? 'var(--primary)' : 'var(--border)',
                color: text.trim() ? 'white' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: text.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s', flexShrink: 0,
              }}
            >
              {sending ? <Loader size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={18} />}
            </motion.button>
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', gap: '1rem'
        }}>
          <div style={{ fontSize: '5rem' }}>💬</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Your Messages</h3>
          <p style={{ fontSize: '0.95rem' }}>Select a conversation or start a new one</p>
        </div>
      )}
    </div>
  );


};

export default Chat;
