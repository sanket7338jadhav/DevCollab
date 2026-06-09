import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, UserSearch, Loader, RefreshCw, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { requestAPI } from '../utils/api';

const StatusBadge = ({ status }) => {
  const colors = {
    pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    accepted: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    rejected: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{ padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, background: c.bg, color: c.color }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const Requests = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('incoming');
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [inc, snt] = await Promise.all([
        requestAPI.getIncoming(),
        requestAPI.getSent(),
      ]);
      setIncoming(inc);
      setSent(snt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAction = async (id, action) => {
    setActionLoading(id + action);
    try {
      const updated = await requestAPI.handle(id, action);
      setIncoming(prev => prev.map(r => r._id === id ? updated : r));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const requests = activeTab === 'incoming' ? incoming : sent;

  return (
    <div className="section" style={{ background: 'var(--background)', minHeight: 'calc(100vh - 64px)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Collaboration Requests</h1>
          <button
            onClick={fetchAll}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <RefreshCw size={15} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--border)', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: '2rem', gap: '4px' }}>
          {[
            { key: 'incoming', label: `Incoming (${incoming.filter(r => r.status === 'pending').length})` },
            { key: 'sent', label: `Sent (${sent.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: '0.65rem 1rem',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                fontWeight: 600, fontSize: '0.9rem',
                background: activeTab === tab.key ? 'var(--surface)' : 'transparent',
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s', cursor: 'pointer', border: 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader size={32} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : requests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{activeTab === 'incoming' ? '📬' : '📤'}</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              No {activeTab === 'incoming' ? 'incoming requests' : 'sent requests'} yet
            </h3>
            <p style={{ marginBottom: '1.5rem' }}>
              {activeTab === 'incoming'
                ? 'When developers apply to your projects, they\'ll appear here.'
                : 'Apply to projects from the Explore page.'}
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <AnimatePresence>
              {requests.map(request => (
                <motion.div
                  key={request._id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="card"
                  style={{ padding: '1.75rem', border: '1px solid var(--border)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                        {activeTab === 'incoming' ? (
                          <>From: <span style={{ color: 'var(--secondary)' }}>{request.from?.name}</span></>
                        ) : (
                          <>To: <span style={{ color: 'var(--secondary)' }}>{request.to?.name}</span></>
                        )}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Project: <strong style={{ color: 'var(--text-main)' }}>{request.project?.title}</strong>
                        {' · '}
                        <span style={{ textTransform: 'capitalize' }}>{request.project?.status}</span>
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  {request.message && (
                    <div style={{
                      background: 'var(--background)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem',
                      fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1rem',
                      fontStyle: 'italic'
                    }}>
                      "{request.message}"
                    </div>
                  )}

                  {/* Skills */}
                  {activeTab === 'incoming' && request.from?.skills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                      {request.from.skills.map(s => (
                        <span key={s} style={{ background: 'rgba(147,51,234,0.1)', border: '1px solid rgba(147,51,234,0.2)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 600 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {activeTab === 'incoming' && (
                        <button
                          onClick={() => navigate(`/chat/${request.from?._id}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          <MessageSquare size={16} /> Chat
                        </button>
                      )}
                    </div>

                    {activeTab === 'incoming' && request.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={() => handleAction(request._id, 'accepted')}
                          disabled={actionLoading === request._id + 'accepted'}
                          style={{ background: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', opacity: actionLoading ? 0.7 : 1 }}
                        >
                          {actionLoading === request._id + 'accepted' ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={16} />}
                          Accept
                        </button>
                        <button
                          onClick={() => handleAction(request._id, 'rejected')}
                          disabled={actionLoading === request._id + 'rejected'}
                          style={{ background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', opacity: actionLoading ? 0.7 : 1 }}
                        >
                          {actionLoading === request._id + 'rejected' ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <X size={16} />}
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
