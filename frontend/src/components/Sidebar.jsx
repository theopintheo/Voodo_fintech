import React from 'react';
import { LayoutDashboard, Wallet, ArrowLeftRight, PieChart, Target, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'accounts', icon: Wallet, label: 'Accounts' },
  { id: 'transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { id: 'budgets', icon: PieChart, label: 'Budgets' },
  { id: 'goals', icon: Target, label: 'Savings Goals' },
  { id: 'quiz', icon: Sparkles, label: 'Quiz' },
  { id: 'peer', icon: TrendingUp, label: 'Peer Compare' },
  { id: 'habits', icon: AlertCircle, label: 'Bad Habits' },
];

function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">V</div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={20} strokeWidth={1.8} />
            <span className="sidebar-tooltip">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
