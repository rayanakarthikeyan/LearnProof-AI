import React from 'react';
import { ChevronRight, CircleHelp, GraduationCap, Moon, Sun } from 'lucide-react';
import type { Health, Tab } from '../types';
import { NAV_ITEMS } from './Sidebar';

interface TopBarProps {
  tab: Tab;
  health: Health | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenModal: (modal: 'help' | 'workspace') => void;
}

export function TopBar({
  tab,
  health,
  theme,
  onToggleTheme,
  onOpenModal,
}: TopBarProps) {
  const currentTabLabel = NAV_ITEMS.find((n) => n[0] === tab)?.[1] || 'Overview';

  return (
    <header className="topbar">
      <div className="breadcrumb">
        My workspace <ChevronRight size={13} />
        <strong>{currentTabLabel}</strong>
      </div>
      <div className="top-actions">
        <span className={`mode-pill ${health?.provider_configured ? 'live' : ''}`}>
          <span />
          {health?.provider_configured ? 'AI connected' : 'Local evidence mode'}
        </span>

        <button
          className="icon-button theme-toggle"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="icon-button"
          aria-label="How LearnProof works"
          onClick={() => onOpenModal('help')}
        >
          <CircleHelp size={19} />
        </button>

        <button
          className="icon-button mobile-scope"
          aria-label="Choose course and learning profile"
          onClick={() => onOpenModal('workspace')}
        >
          <GraduationCap size={19} />
        </button>
      </div>
    </header>
  );
}
