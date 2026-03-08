import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Smartphone, TrendingUp } from 'lucide-react';
import axios from 'axios';
import InlineEditAmount from '../components/InlineEditAmount';

const API_BASE = '';

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const iconMap = {
  Building2: Building2,
  Smartphone: Smartphone,
  TrendingUp: TrendingUp,
};

function AccountsPage({ sessionId }) {
  const [accounts, setAccounts] = useState(null);

  useEffect(() => {
    if (sessionId) {
      axios.get(`${API_BASE}/api/finance/accounts/${sessionId}`).then(res => setAccounts(res.data)).catch(console.error);
    }
  }, [sessionId]);

  const updateBalance = async (accountId, newBalance) => {
    try {
      await axios.put(`${API_BASE}/api/finance/accounts/${sessionId}/${accountId}`, { amount: newBalance });
      setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: newBalance } : a));
    } catch (e) {
      console.error(e);
    }
  };

  if (!accounts) return <div style={{ color: "var(--text-muted)", padding: "20px" }}>Loading accounts...</div>;

  const totalNetWorth = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      <motion.div variants={item} className="glass-card net-worth-card">
        <div className="net-worth-label">Total Portfolio Net Worth</div>
        <div className="net-worth-value">₹{totalNetWorth.toLocaleString('en-IN')}</div>
        <div className="net-worth-change positive">
          <TrendingUp size={16} /> +₹18,200 (8.0%) this month
        </div>
      </motion.div>

      <motion.div variants={item} className="section-header">
        <h2>Connected Accounts</h2>
        <span className="section-count">{accounts.length} accounts</span>
      </motion.div>

      <div className="accounts-grid">
        {accounts.map(acc => {
          const IconComp = iconMap[acc.icon] || Building2;
          return (
            <motion.div key={acc.id} variants={item} className="glass-card account-card" whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <div className="account-card-top">
                <div className={`account-icon account-icon--${acc.color}`}>
                  <IconComp size={20} strokeWidth={1.8} />
                </div>
                <span className="account-status">{acc.status}</span>
              </div>
              <div className="account-name">{acc.name}</div>
              <div className="account-type">{acc.type}</div>
              <div className="account-balance">
                <InlineEditAmount value={acc.balance} onSave={(val) => updateBalance(acc.id, val)} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default AccountsPage;
