import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, ExternalLink, Loader, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  'Not Started': { bg: 'rgba(99,102,241,0.12)', color: '#6366f1' },
  'In Progress': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  'Completed': { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
};

const ProjectCard = ({ project, isOwner, onDelete }) => {
  const [deleting, setDeleting] = useState(false);
  const statusStyle = STATUS_COLORS[project.status] || STATUS_COLORS['Not Started'];

  const handleDelete = async () => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    setDeleting(true);
    await onDelete(project._id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="card"
      style={{ padding: '1.5rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.25, flex: 1 }}>{project.title}</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-full)', background: statusStyle.bg, color: statusStyle.color, whiteSpace: 'nowrap' }}>
            {project.status}
          </span>
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem' }}>
        {project.description?.slice(0, 120)}{project.description?.length > 120 ? '...' : ''}
      </p>

      {project.techStack?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
          {project.techStack.map(t => (
            <span key={t} style={{ background: 'var(--border)', color: 'var(--text-main)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
              {t}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}
        </span>
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            {deleting ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={14} />}
            Delete
          </button>
        )}
      </div>
    </motion.div>
  );
};

const MyProjects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [owned, setOwned] = useState([]);
  const [joined, setJoined] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectAPI.getMy();
      setOwned(data.owned || []);
      setJoined(data.joined || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id) => {
    try {
      await projectAPI.delete(id);
      setOwned(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="section" style={{ background: 'var(--background)', minHeight: 'calc(100vh - 64px)' }}>
      <div className="container" style={{ maxWidth: '1100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>My Projects</h1>
            <p style={{ color: 'var(--text-muted)' }}>{owned.length} owned · {joined.length} joined</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={fetchProjects}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
            >
              <RefreshCw size={15} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Refresh
            </button>
            <button
              onClick={() => navigate('/add-project')}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} /> New Project
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader size={32} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' }}>
            {/* Published */}
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700 }}>
                📦 Published Projects
                <span style={{ fontSize: '0.875rem', background: 'var(--border)', padding: '0.25rem 0.7rem', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {owned.length}
                </span>
              </h2>

              {owned.length === 0 ? (
                <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You haven't published any projects yet.</p>
                  <button onClick={() => navigate('/add-project')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={16} /> Create one
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {owned.map(p => (
                      <ProjectCard key={p._id} project={p} isOwner={true} onDelete={handleDelete} />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* Joined */}
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700 }}>
                🤝 Joined Projects
                <span style={{ fontSize: '0.875rem', background: 'var(--border)', padding: '0.25rem 0.7rem', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {joined.length}
                </span>
              </h2>

              {joined.length === 0 ? (
                <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👀</div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You haven't joined any projects yet.</p>
                  <button onClick={() => navigate('/explore')} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ExternalLink size={16} /> Explore projects
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {joined.map(p => (
                      <ProjectCard key={p._id} project={p} isOwner={false} onDelete={handleDelete} />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProjects;
