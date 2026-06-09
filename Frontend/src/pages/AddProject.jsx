import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const TECH_OPTIONS = [
  'React', 'Vue.js', 'Angular', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'Python', 'JavaScript', 'TypeScript',
  'Java', 'Docker', 'AWS', 'Tailwind CSS', 'GraphQL', 'Solidity', 'Web3.js', 'MQTT',
];

const ROLE_OPTIONS = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'UI/UX Designer', 'Data Scientist', 'IoT Engineer', 'DevOps Engineer', 'Mobile Developer',
];

const DOMAIN_OPTIONS = [
  'General', 'Healthcare', 'FinTech', 'EdTech', 'IoT', 'Marketplace',
  'DevTools', 'Environment', 'Social Network', 'Gaming', 'AI/ML',
];

const AddProject = () => {
  const { updateUser, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    techStack: [],
    lookingFor: [],
    domain: 'General',
    status: 'Not Started',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCheckboxChange = (category, value) => {
    setFormData(prev => {
      const current = [...prev[category]];
      const idx = current.indexOf(value);
      if (idx > -1) current.splice(idx, 1);
      else current.push(value);
      return { ...prev, [category]: current };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setLoading(true);
    try {
      await projectAPI.create(formData);
      setSuccess(true);
      setTimeout(() => navigate('/projects'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="section" style={{ background: 'var(--background)', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
          <CheckCircle size={80} color="#22c55e" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Project Posted!</h2>
          <p style={{ color: 'var(--text-muted)' }}>Redirecting to your projects...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="section" style={{ background: 'var(--background)', minHeight: 'calc(100vh - 64px)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ padding: '3rem' }}
        >
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800 }}>Post a New Project</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Share your idea and find the right collaborators.</p>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Project Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. AI-powered Study Planner"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description *</label>
              <textarea
                className="form-control"
                rows="5"
                placeholder="Describe your project idea, goals, and what you're building..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Domain</label>
              <select
                className="form-control"
                value={formData.domain}
                onChange={e => setFormData({ ...formData, domain: e.target.value })}
                style={{ height: '3rem' }}
              >
                {DOMAIN_OPTIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Tech Stack</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem', marginTop: '0.5rem' }}>
                {TECH_OPTIONS.map(tech => (
                  <label key={tech} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)', background: formData.techStack.includes(tech) ? 'rgba(147,51,234,0.07)' : 'transparent', transition: 'background 0.15s' }}>
                    <input
                      type="checkbox"
                      checked={formData.techStack.includes(tech)}
                      onChange={() => handleCheckboxChange('techStack', tech)}
                      style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                    />
                    <span style={{ color: formData.techStack.includes(tech) ? 'var(--primary)' : 'var(--text-main)', fontWeight: formData.techStack.includes(tech) ? 600 : 400 }}>
                      {tech}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Looking For</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.6rem', marginTop: '0.5rem' }}>
                {ROLE_OPTIONS.map(role => (
                  <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)', background: formData.lookingFor.includes(role) ? 'rgba(59,130,246,0.07)' : 'transparent', transition: 'background 0.15s' }}>
                    <input
                      type="checkbox"
                      checked={formData.lookingFor.includes(role)}
                      onChange={() => handleCheckboxChange('lookingFor', role)}
                      style={{ accentColor: 'var(--secondary)', width: '15px', height: '15px' }}
                    />
                    <span style={{ color: formData.lookingFor.includes(role) ? 'var(--secondary)' : 'var(--text-main)', fontWeight: formData.lookingFor.includes(role) ? 600 : 400 }}>
                      {role}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Project Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                style={{ height: '3rem' }}
              >
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{ flex: 1, padding: '1rem', background: 'var(--border)', color: 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ flex: 3, padding: '1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? <><Loader size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Publishing...</> : '🚀 Publish Project'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AddProject;
