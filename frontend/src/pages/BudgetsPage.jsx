import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Utensils, Car, ShoppingBag, Film, PiggyBank, Sparkles, Zap, Building2, RefreshCw, Loader2 } from 'lucide-react';
import axios from 'axios';
import InlineEditAmount from '../components/InlineEditAmount';

const API_BASE = '';

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const iconMap = {
  Home: Home,
  Utensils: Utensils,
  Car: Car,
  ShoppingBag: ShoppingBag,
  Film: Film,
  PiggyBank: PiggyBank,
  Zap: Zap,
  Building2: Building2
};

function BudgetsPage({ sessionId }) {
  const [budgets, setBudgets] = useState(null);
  const [aiRecs, setAiRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    if (sessionId) {
      axios.get(`${API_BASE}/api/finance/budgets/${sessionId}`).then(res => setBudgets(res.data)).catch(console.error);
      fetchAIAdvice();
    }
  }, [sessionId]);

  const fetchAIAdvice = async () => {
    if (!sessionId) return;
    setLoadingRecs(true);
    try {
      const res = await axios.get(`${API_BASE}/api/finance/budget-advice/${sessionId}`);
      setAiRecs(res.data.recommendations || []);
    } catch (e) {
      console.error(e);
      setAiRecs([
        "Review categories exceeding 90% of their budget and set stricter weekly limits.",
        "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
        "Track small daily expenses — they add up to thousands monthly.",
        "Automate savings by transferring a fixed amount on payday."
      ]);
    }
    setLoadingRecs(false);
  };

  const updateBudget = async (id, param, newValue) => {
    const budget = budgets.find(b => b.id === id);
    if (!budget) return;
    const upd = { limit: budget.limit, spent: budget.spent, [param]: newValue };
    try {
      await axios.put(`${API_BASE}/api/finance/budgets/${sessionId}/${id}`, upd);
      setBudgets(prev => prev.map(b => b.id === id ? { ...b, [param]: newValue } : b));
    } catch(e) { console.error(e); }
  };

  if (!budgets) return <div style={{ color: "var(--text-muted)", padding: "20px" }}>Loading budgets...</div>;

  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalPct = Math.round((totalSpent / totalLimit) * 100);

  const getStatus = (pct) => pct >= 100 ? 'danger' : pct >= 85 ? 'warning' : 'safe';

  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      {/* Overview Bar */}
      <motion.div variants={item} className="glass-card budget-overview">
        <div className="budget-overview-left">
          <span className="budget-overview-label">Total Budget Used</span>
          <span className="budget-overview-value">
            ₹{totalSpent.toLocaleString('en-IN')} <span className="budget-overview-limit">/ ₹{totalLimit.toLocaleString('en-IN')}</span>
          </span>
        </div>
        <div className="budget-overview-bar-container">
          <div className="budget-overview-bar">
            <motion.div
              className="budget-overview-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${totalPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <span className="budget-overview-percent">{totalPct}%</span>
        </div>
      </motion.div>

      {/* Budget Cards */}
      <div className="budget-grid">
        {budgets.map((b, i) => {
          const pct = Math.round((b.spent / b.limit) * 100);
          const status = getStatus(pct);
          const IconComp = iconMap[b.icon] || Home;
          return (
            <motion.div key={i} variants={item} className="glass-card budget-card" whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <div className="budget-card-header">
                <div className="budget-card-left">
                  <div className="budget-icon" style={{ background: b.color + '22', color: b.color }}>
                    <IconComp size={18} strokeWidth={1.8} />
                  </div>
                  <span className="budget-category">{b.category}</span>
                </div>
                <span className={`budget-percent ${status}`}>{pct}%</span>
              </div>
              <div className="budget-bar">
                <motion.div
                  className="budget-bar-fill"
                  style={{ background: b.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pct, 100)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                />
              </div>
              <div className="budget-amounts">
                <span><InlineEditAmount value={b.spent} onSave={(val) => updateBudget(b.id, 'spent', val)} /> spent</span>
                <span><InlineEditAmount value={b.limit} onSave={(val) => updateBudget(b.id, 'limit', val)} /> limit</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* AI Recommendations - Now Dynamic */}
      <motion.div variants={item} className="glass-card ai-recommendations">
        <div className="ai-rec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} strokeWidth={1.8} />
            <h2>AI Recommendations</h2>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'var(--accent-purple)', color: 'white', fontWeight: '600', letterSpacing: '0.03em' }}>
              LIVE
            </span>
          </div>
          <motion.button
            onClick={fetchAIAdvice}
            disabled={loadingRecs}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 14px',
              cursor: loadingRecs ? 'wait' : 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
            whileHover={{ scale: 1.02, borderColor: 'var(--accent-purple)' }}
            whileTap={{ scale: 0.98 }}
          >
            {loadingRecs ? <Loader2 size={14} className="spinning" /> : <RefreshCw size={14} />}
            {loadingRecs ? 'Analyzing...' : 'Refresh'}
          </motion.button>
        </div>
        <div className="ai-rec-list">
          {loadingRecs ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: '20px', borderRadius: '8px', background: 'var(--bg-input)', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : (
            aiRecs.map((rec, i) => (
              <motion.div key={i} variants={item} className="ai-rec-item">
                <div className="ai-rec-bullet" />
                <span>{rec}</span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default BudgetsPage;
