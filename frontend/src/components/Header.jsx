import React from 'react';
import { Sun, Moon, Settings } from 'lucide-react';

function Header({ title, theme, onToggleTheme, onEditProfile }) {
  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        {onEditProfile && (
          <button className="theme-toggle" onClick={onEditProfile} title="Edit Financial Profile">
            <Settings size={18} strokeWidth={1.8} />
          </button>
        )}
        <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
        </button>
      </div>
    </header>
  );
}

export default Header;
