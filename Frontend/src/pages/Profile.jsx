import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Edit, Save, X, PlusCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import './Profile.css';

const SKILL_OPTIONS = [
  'React', 'Vue.js', 'Angular', 'Next.js',
  'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase',
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go',
  'Docker', 'Kubernetes', 'AWS', 'Git',
  'Machine Learning', 'Data Science', 'UI/UX Design',
];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    bio: '',
    skills: [],
    github: '',
    linkedin: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        skills: user.skills || [],
        github: user.github || '',
        linkedin: user.linkedin || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await userAPI.updateProfile(form);
      updateUser({ ...user, ...updated });
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (skill) => {
    if (!form.skills.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
    setSkillInput('');
    setShowSkillDropdown(false);
  };

  const removeSkill = (skill) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const filteredSkills = SKILL_OPTIONS.filter(
    s => s.toLowerCase().includes(skillInput.toLowerCase()) && !form.skills.includes(s)
  );

  if (!user) return null;

  const displayData = editing ? form : {
    name: user.name,
    bio: user.bio,
    skills: user.skills,
    github: user.github,
    linkedin: user.linkedin,
  };

  return (
    <div className="profile-page">
      <div className="profile-container animate-fade-in">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="profile-card"
        >
          <div className="profile-header">
            <h1 className="profile-title">My Profile</h1>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {editing ? (
                <>
                  <button
                    onClick={() => { setEditing(false); setError(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)',
                      background: 'var(--border)', color: 'var(--text-muted)',
                      fontWeight: 600, border: 'none', cursor: 'pointer'
                    }}
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)',
                      background: 'var(--primary)', color: 'white',
                      fontWeight: 600, border: 'none', cursor: 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    <Save size={16} /> {loading ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <button className="btn-edit" onClick={() => setEditing(true)}>
                  <Edit size={16} /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {success && (
            <div style={{
              background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
              color: '#22c55e', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              marginBottom: '1rem', fontWeight: 500
            }}>
              ✅ {success}
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              marginBottom: '1rem', fontWeight: 500
            }}>
              {error}
            </div>
          )}

          <div className="profile-content">
            <div className="profile-sidebar">
              <div className="avatar-placeholder">
                <User size={64} />
              </div>
              {editing ? (
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="form-control"
                  style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.2rem', marginTop: '0.5rem' }}
                />
              ) : (
                <h2 className="user-name">{user.name}</h2>
              )}
              <p className="user-email">{user.email}</p>
              <div style={{
                marginTop: '0.75rem', padding: '0.4rem 1rem',
                background: 'rgba(147,51,234,0.1)', border: '1px solid rgba(147,51,234,0.2)',
                borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--primary)'
              }}>
                {user.skills?.length || 0} skills
              </div>
            </div>

            <div className="profile-main">
              {/* Bio */}
              <div className="info-section">
                <label>BIO</label>
                {editing ? (
                  <textarea
                    value={form.bio}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    className="form-control"
                    rows={3}
                    placeholder="Tell the team about yourself..."
                    style={{ resize: 'none', marginTop: '0.5rem' }}
                  />
                ) : (
                  <p className="empty-text">
                    {user.bio || 'No bio yet. Click Edit Profile to add one.'}
                  </p>
                )}
              </div>

              {/* Skills */}
              <div className="info-section">
                <label>SKILLS</label>
                <div className="skills-container" style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: editing ? '0.75rem' : 0 }}>
                    {(editing ? form.skills : user.skills || []).map(skill => (
                      <span
                        key={skill}
                        style={{
                          background: 'rgba(147,51,234,0.1)',
                          border: '1px solid rgba(147,51,234,0.25)',
                          color: 'var(--primary)',
                          padding: '0.3rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: '0.35rem'
                        }}
                      >
                        {skill}
                        {editing && (
                          <button onClick={() => removeSkill(skill)} style={{ display: 'flex', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
                            <X size={11} />
                          </button>
                        )}
                      </span>
                    ))}
                    {(!editing && (!user.skills || user.skills.length === 0)) && (
                      <div className="empty-bar" />
                    )}
                  </div>

                  {editing && (
                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          value={skillInput}
                          onChange={e => { setSkillInput(e.target.value); setShowSkillDropdown(true); }}
                          onFocus={() => setShowSkillDropdown(true)}
                          className="form-control"
                          placeholder="Search or type a skill..."
                          style={{ flex: 1 }}
                        />
                        {skillInput && (
                          <button
                            onClick={() => addSkill(skillInput)}
                            style={{
                              padding: '0 1rem', background: 'var(--primary)', color: 'white',
                              border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                              fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem'
                            }}
                          >
                            <PlusCircle size={16} /> Add
                          </button>
                        )}
                      </div>
                      {showSkillDropdown && filteredSkills.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                          maxHeight: '200px', overflowY: 'auto', marginTop: '4px'
                        }}>
                          {filteredSkills.slice(0, 10).map(s => (
                            <div
                              key={s}
                              onClick={() => addSkill(s)}
                              style={{
                                padding: '0.6rem 1rem', cursor: 'pointer',
                                fontSize: '0.875rem', color: 'var(--text-main)',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(147,51,234,0.07)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {s}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="info-grid">
                {/* GitHub */}
                <div className="info-section">
                  <label>GITHUB</label>
                  {editing ? (
                    <input
                      value={form.github}
                      onChange={e => setForm(p => ({ ...p, github: e.target.value }))}
                      className="form-control"
                      placeholder="https://github.com/username"
                      style={{ marginTop: '0.5rem' }}
                    />
                  ) : (
                    <div className={`social-link ${!user.github ? 'empty' : ''}`}>
                      <Github size={18} />
                      {user.github
                        ? <a href={user.github} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)' }}>{user.github}</a>
                        : <span>Not set</span>
                      }
                    </div>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="info-section">
                  <label>LINKEDIN</label>
                  {editing ? (
                    <input
                      value={form.linkedin}
                      onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))}
                      className="form-control"
                      placeholder="https://linkedin.com/in/username"
                      style={{ marginTop: '0.5rem' }}
                    />
                  ) : (
                    <div className={`social-link ${!user.linkedin ? 'empty' : ''}`}>
                      <Linkedin size={18} />
                      {user.linkedin
                        ? <a href={user.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)' }}>{user.linkedin}</a>
                        : <span>Not set</span>
                      }
                    </div>
                  )}
                </div>

                {/* Owned Projects */}
                <div className="info-section">
                  <label>OWNED PROJECTS</label>
                  {user.ownedProjects?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {user.ownedProjects.map(p => (
                        <span key={p._id} style={{
                          padding: '0.4rem 0.75rem',
                          background: 'var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}>
                          {p.title}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-text italic">No owned projects</p>
                  )}
                </div>

                {/* Joined Projects */}
                <div className="info-section">
                  <label>JOINED PROJECTS</label>
                  {user.joinedProjects?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {user.joinedProjects.map(p => (
                        <span key={p._id} style={{
                          padding: '0.4rem 0.75rem',
                          background: 'var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                          fontWeight: 500
                        }}>
                          {p.title}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-text italic">No joined projects</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
