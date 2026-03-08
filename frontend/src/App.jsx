import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import QuizPage from './pages/QuizPage';
import PeerComparePage from './pages/PeerComparePage';
import BadHabitsPage from './pages/BadHabitsPage';
import GoalsPage from './pages/GoalsPage';
import OnboardingPage from './pages/OnboardingPage';
import { AnimatePresence, motion } from 'framer-motion';

const API_BASE = '';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('voodo_theme') || 'dark');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('finance_session_id'));
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('voodo_theme', theme);
  }, [theme]);

  useEffect(() => {
    const createNewSession = () => {
      axios.post(`${API_BASE}/session/create`).then(res => {
        const newId = res.data.session_id;
        setSessionId(newId);
        localStorage.setItem('finance_session_id', newId);
        setOnboarded(false);
      }).catch(err => console.error('Session creation failed:', err));
    };

    if (!sessionId) {
      createNewSession();
    } else {
      // Health check
      axios.get(`${API_BASE}/session/${sessionId}`).then(res => {
        setOnboarded(res.data.onboarded);
      }).catch(err => {
        if (err.response?.status === 404 || err.response?.status === 500) {
          localStorage.removeItem('finance_session_id');
          createNewSession();
        }
      });
    }
  }, [sessionId]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const pageTitles = { dashboard: 'Dashboard', accounts: 'Accounts', transactions: 'Transactions', budgets: 'Budgets', goals: 'Savings Goals' };

  const renderPage = () => {
    switch (currentPage) {
      case 'accounts': return <AccountsPage sessionId={sessionId} />;
      case 'transactions': return <TransactionsPage sessionId={sessionId} />;
      case 'budgets': return <BudgetsPage sessionId={sessionId} />;
      case 'goals': return <GoalsPage sessionId={sessionId} />;
      case 'quiz': return <QuizPage sessionId={sessionId} onComplete={() => setOnboarded(true)} />;
      case 'peer': return <PeerComparePage sessionId={sessionId} />;
      case 'habits': return <BadHabitsPage sessionId={sessionId} />;
      default: return <DashboardPage sessionId={sessionId} />;
    }
  };

  if (!onboarded && sessionId) {
    return <OnboardingPage sessionId={sessionId} onComplete={() => setOnboarded(true)} />;
  }

  return (
    <div className="app-layout">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="main-content">
        <Header 
          title={pageTitles[currentPage]} 
          theme={theme} 
          onToggleTheme={toggleTheme} 
          onEditProfile={() => setOnboarded(false)}
        />
        <div className="page-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="page-wrapper"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default App;
