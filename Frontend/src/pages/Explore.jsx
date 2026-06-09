import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, X, ChevronDown, SlidersHorizontal,
  Tag, Layers, Briefcase, CircleDot, Send, Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectAPI, requestAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ALL_TECH = ['React', 'Node.js', 'MongoDB', 'Express', 'Python', 'Flask', 'Firebase', 'Solidity', 'Web3.js', 'MQTT', 'TypeScript', 'Vue.js', 'Django'];
const ALL_ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'UI/UX Designer', 'Data Scientist', 'IoT Engineer'];
const ALL_DOMAINS = ['Healthcare', 'FinTech', 'IoT', 'EdTech', 'Marketplace', 'DevTools', 'Environment', 'General'];
const ALL_STATUSES = ['Not Started', 'In Progress', 'Completed'];

const STATUS_COLORS = {
  'Not Started': { bg: 'rgba(99,102,241,0.12)', color: '#6366f1' },
  'In Progress': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  'Completed': { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
};

const FilterPill = ({ label, onRemove }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85 }}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      background: 'rgba(147,51,234,0.12)', color: 'var(--primary)',
      border: '1px solid rgba(147,51,234,0.3)', padding: '0.3rem 0.75rem',
      borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600, cursor: 'default',
    }}
  >
    {label}
    <button onClick={onRemove} style={{ display: 'flex', color: 'inherit', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      <X size={12} />
    </button>
  </motion.span>
);

const CheckOption = ({ label, checked, onChange }) => (
  <label
    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.45rem 0.5rem', borderRadius: 'var(--radius-sm)', transition: 'background 0.15s', userSelect: 'none' }}
    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(147,51,234,0.07)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
  >
    <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
    <span style={{
      width: 17, height: 17, borderRadius: 4, flexShrink: 0,
      border: checked ? 'none' : '1.5px solid var(--border)',
      background: checked ? 'var(--primary)' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
    }}>
      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </span>
    <span style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: checked ? 600 : 400 }}>{label}</span>
  </label>
);

const FilterSection = ({ icon: Icon, title, options, selected, onToggle }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
      <Icon size={14} style={{ color: 'var(--primary)' }} />
      <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{title}</span>
    </div>
    {options.map(opt => (
      <CheckOption key={opt} label={opt} checked={selected.includes(opt)} onChange={() => onToggle(opt)} />
    ))}
  </div>
);

const ProjectCard = ({ project, index, onApply, currentUserId, appliedIds }) => {
  const statusStyle = STATUS_COLORS[project.status] || STATUS_COLORS['Not Started'];
  const isOwner = project.owner?._id === currentUserId;
  const isMember = project.members?.some(m => m._id === currentUserId || m === currentUserId);
  const hasApplied = appliedIds.includes(project._id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ y: -6 }}
      className="card"
      style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.25 }}>{project.title}</h3>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.7rem',
          borderRadius: 'var(--radius-full)', background: statusStyle.bg, color: statusStyle.color,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {project.status}
        </span>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {project.description?.slice(0, 120)}{project.description?.length > 120 ? '...' : ''}
      </p>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        by <strong style={{ color: 'var(--text-main)' }}>{project.owner?.name || 'Unknown'}</strong>
        {' · '}<span style={{ color: 'var(--secondary)' }}>{project.domain}</span>
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {project.techStack?.map(t => (
          <span key={t} style={{ background: 'var(--border)', color: 'var(--text-main)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
            {t}
          </span>
        ))}
      </div>

      {project.lookingFor?.length > 0 && (
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 500 }}>Looking for:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {project.lookingFor.map(r => (
              <span key={r} style={{ border: '1px solid var(--secondary)', color: 'var(--secondary)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 600 }}>
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        className="btn-primary"
        style={{
          marginTop: '0.5rem', width: '100%', padding: '0.65rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          background: isOwner || isMember ? 'var(--border)' : hasApplied ? 'rgba(34,197,94,0.15)' : 'var(--primary)',
          color: isOwner || isMember ? 'var(--text-muted)' : hasApplied ? '#22c55e' : 'white',
          cursor: isOwner || isMember ? 'default' : 'pointer',
        }}
        onClick={() => !isOwner && !isMember && !hasApplied && onApply(project)}
        disabled={isOwner || isMember || hasApplied}
      >
        {isOwner ? '👑 Your Project' : isMember ? '✅ Member' : hasApplied ? '✅ Applied' : (
          <><Send size={15} /> Apply to Join</>
        )}
      </button>
    </motion.div>
  );
};

// Apply Modal
const ApplyModal = ({ project, onClose, onSubmit }) => {
  const [message, setMessage] = useState(`Hi! I'd love to collaborate on ${project?.title}.`);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit(project._id, message);
    setLoading(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999, padding: '2rem'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          padding: '2.5rem', width: '100%', maxWidth: '500px',
          boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Apply to: {project?.title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <div className="input-group">
          <label className="input-label">Message to Project Owner</label>
          <textarea
            className="form-control"
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{ resize: 'none', marginTop: '0.5rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: 'var(--border)', color: 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !message.trim()}
            className="btn-primary"
            style={{ flex: 2, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={16} />}
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Explore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [appliedIds, setAppliedIds] = useState([]);
  const [applyTarget, setApplyTarget] = useState(null);
  const [toast, setToast] = useState('');
  const filterPanelRef = useRef(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectAPI.getAll();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => {
    const handler = e => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (setter, value) =>
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);

  const allActiveFilters = [
    ...selectedTech.map(v => ({ label: v, remove: () => toggle(setSelectedTech, v) })),
    ...selectedRoles.map(v => ({ label: v, remove: () => toggle(setSelectedRoles, v) })),
    ...selectedDomains.map(v => ({ label: v, remove: () => toggle(setSelectedDomains, v) })),
    ...selectedStatuses.map(v => ({ label: v, remove: () => toggle(setSelectedStatuses, v) })),
  ];

  const clearAll = () => {
    setSelectedTech([]); setSelectedRoles([]); setSelectedDomains([]); setSelectedStatuses([]); setQuery('');
  };

  const filteredProjects = useMemo(() => {
    const q = query.toLowerCase().trim();
    return projects.filter(p => {
      const matchesQuery = !q || p.title?.toLowerCase().includes(q) || p.author?.toLowerCase().includes(q) || p.domain?.toLowerCase().includes(q) || p.techStack?.some(t => t.toLowerCase().includes(q)) || p.owner?.name?.toLowerCase().includes(q);
      const matchesTech = !selectedTech.length || selectedTech.every(t => p.techStack?.includes(t));
      const matchesRoles = !selectedRoles.length || selectedRoles.some(r => p.lookingFor?.includes(r));
      const matchesDomain = !selectedDomains.length || selectedDomains.includes(p.domain);
      const matchesStatus = !selectedStatuses.length || selectedStatuses.includes(p.status);
      return matchesQuery && matchesTech && matchesRoles && matchesDomain && matchesStatus;
    });
  }, [query, projects, selectedTech, selectedRoles, selectedDomains, selectedStatuses]);

  const handleApply = async (projectId, message) => {
    try {
      await requestAPI.send({ projectId, message });
      setAppliedIds(prev => [...prev, projectId]);
      setToast('🎉 Request sent successfully!');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setToast(`❌ ${err.message}`);
      setTimeout(() => setToast(''), 4000);
    }
  };

  return (
    <div className="section" style={{ background: 'var(--background)', minHeight: 'calc(100vh - 64px)', position: 'relative' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            style={{
              position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.5rem', boxShadow: 'var(--shadow-xl)', zIndex: 999,
              fontWeight: 600, whiteSpace: 'nowrap'
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.4rem' }}>Explore Projects 🚀</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            {loading ? 'Loading...' : `${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''} found`}
          </p>
        </motion.div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} size={18} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, author, tech, domain…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft: '2.75rem', paddingRight: query ? '2.5rem' : '1rem', height: '48px' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={16} />
              </button>
            )}
          </div>

          <div style={{ position: 'relative' }} ref={filterPanelRef}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilterOpen(o => !o)}
              style={{
                height: '48px', padding: '0 1.25rem', borderRadius: 'var(--radius-md)',
                background: filterOpen ? 'var(--primary)' : 'var(--surface)',
                color: filterOpen ? 'white' : 'var(--text-main)',
                border: `1px solid ${filterOpen ? 'var(--primary)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem',
                transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={17} />
              Filters
              {allActiveFilters.length > 0 && (
                <span style={{ background: filterOpen ? 'rgba(255,255,255,0.25)' : 'var(--primary)', color: 'white', borderRadius: 'var(--radius-full)', minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, padding: '0 5px' }}>
                  {allActiveFilters.length}
                </span>
              )}
              <ChevronDown size={15} style={{ transform: filterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </motion.button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '320px',
                    boxShadow: 'var(--shadow-xl)', zIndex: 200, maxHeight: '80vh', overflowY: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Filter Projects</span>
                    {allActiveFilters.length > 0 && (
                      <button onClick={clearAll} style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={13} /> Clear all
                      </button>
                    )}
                  </div>

                  <FilterSection icon={Layers} title="Tech Stack" options={ALL_TECH} selected={selectedTech} onToggle={v => toggle(setSelectedTech, v)} />
                  <FilterSection icon={Briefcase} title="Looking For" options={ALL_ROLES} selected={selectedRoles} onToggle={v => toggle(setSelectedRoles, v)} />
                  <FilterSection icon={Tag} title="Domain" options={ALL_DOMAINS} selected={selectedDomains} onToggle={v => toggle(setSelectedDomains, v)} />
                  <FilterSection icon={CircleDot} title="Status" options={ALL_STATUSES} selected={selectedStatuses} onToggle={v => toggle(setSelectedStatuses, v)} />

                  <button className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setFilterOpen(false)}>
                    Show {filteredProjects.length} Result{filteredProjects.length !== 1 ? 's' : ''}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {allActiveFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem', overflow: 'hidden' }}
            >
              <AnimatePresence>
                {allActiveFilters.map(f => <FilterPill key={f.label} label={f.label} onRemove={f.remove} />)}
              </AnimatePresence>
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={clearAll}
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Clear all
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.75rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card" style={{ padding: '1.75rem', height: '280px', background: 'var(--surface)', animation: 'pulse 1.5s ease-in-out infinite' }}>
                <div style={{ height: '1.2rem', background: 'var(--border)', borderRadius: 4, marginBottom: '1rem', width: '60%' }} />
                <div style={{ height: '0.8rem', background: 'var(--border)', borderRadius: 4, marginBottom: '0.5rem' }} />
                <div style={{ height: '0.8rem', background: 'var(--border)', borderRadius: 4, width: '80%' }} />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredProjects.length > 0 ? (
              <motion.div
                key="grid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.75rem' }}
              >
                {filteredProjects.map((project, i) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    index={i}
                    currentUserId={user?._id}
                    appliedIds={appliedIds}
                    onApply={(p) => setApplyTarget(p)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}
              >
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No projects found</h3>
                <p style={{ marginBottom: '1.5rem' }}>Try adjusting your search or removing some filters.</p>
                <button className="btn-primary" onClick={clearAll} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <X size={16} /> Clear filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/add-project')}
        style={{
          position: 'fixed', bottom: '2.5rem', right: '2.5rem',
          width: '64px', height: '64px', borderRadius: 'var(--radius-full)',
          background: 'var(--primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-xl)', zIndex: 100, border: 'none', cursor: 'pointer',
        }}
      >
        <Plus size={32} />
      </motion.button>

      <AnimatePresence>
        {applyTarget && (
          <ApplyModal
            project={applyTarget}
            onClose={() => setApplyTarget(null)}
            onSubmit={handleApply}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Explore;
