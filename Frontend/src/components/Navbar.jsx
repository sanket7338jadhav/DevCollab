import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass, User, Briefcase, MessageSquare, PlusCircle,
  LogOut, Rocket, Sun, Moon, MessageCircle
} from 'lucide-react';

const Navbar = ({ onLogout, theme, toggleTheme }) => {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Rocket size={28} style={{ strokeWidth: 2.5 }} />
        <span>DevCollab</span>
      </div>

      <div className="nav-links">
        <NavLink to="/explore" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Compass size={18} /> Explore
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Briefcase size={18} /> Projects
        </NavLink>
        <NavLink to="/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquare size={18} /> Requests
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageCircle size={18} /> Chat
        </NavLink>
        <NavLink to="/add-project" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PlusCircle size={18} /> New Post
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={18} /> Profile
        </NavLink>
        <button onClick={toggleTheme} className="nav-item" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? <Moon size={18} color="#facc15" /> : <Sun size={18} color="#fde047" />}
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
        <button onClick={onLogout} className="nav-item">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
