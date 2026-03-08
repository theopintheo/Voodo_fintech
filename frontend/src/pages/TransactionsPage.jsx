import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Coffee, ShoppingBag, Car, Zap, Film, Home, CreditCard, Plus, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import axios from 'axios';
import InlineEditAmount from '../components/InlineEditAmount';

const API_BASE = '';

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3 } } };

const iconMap = {
  Coffee: Coffee,
  ShoppingBag: ShoppingBag,
  Car: Car,
  Zap: Zap,
  Film: Film,
  Home: Home,
  CreditCard: CreditCard,
};

const CATEGORIES = ['Housing', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Savings', 'Debt/EMI', 'Income'];

function TransactionsPage({ sessionId }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [transactions, setTransactions] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTx, setNewTx] = useState({ name: '', category: 'Food', amount: '', type: 'expense' });

  useEffect(() => {
    if (sessionId) {
      axios.get(`${API_BASE}/api/finance/transactions/${sessionId}`).then(res => setTransactions(res.data)).catch(console.error);
    }
  }, [sessionId]);

  const updateTransaction = async (txId, newAmount) => {
    try {
      await axios.put(`${API_BASE}/api/finance/transactions/${sessionId}/${txId}`, { amount: newAmount });
      setTransactions(prev => prev.map(t => t.id === txId ? { ...t, amount: newAmount } : t));
    } catch (e) {
      console.error(e);
    }
  };

  const addTransaction = async () => {
    if (!newTx.name.trim() || !newTx.amount) return;
    setAdding(true);
    try {
      await axios.post(`${API_BASE}/api/finance/transactions/${sessionId}/add`, {
        name: newTx.name,
        category: newTx.category,
        amount: Number(newTx.amount),
        type: newTx.type,
      });
      // Refresh transactions
      const res = await axios.get(`${API_BASE}/api/finance/transactions/${sessionId}`);
      setTransactions(res.data);
      setNewTx({ name: '', category: 'Food', amount: '', type: 'expense' });
      setShowAddForm(false);
    } catch (e) {
      console.error(e);
    }
    setAdding(false);
  };

  if (!transactions) return <div style={{ color: "var(--text-muted)", padding: "20px" }}>Loading transactions...</div>;

  const categories = ['All', ...new Set(transactions.map(t => t.category))];

  const filtered = transactions.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || t.category === filter;
    return matchSearch && matchFilter;
  });

  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      <motion.div variants={item} className="glass-card transactions-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={18} strokeWidth={1.8} className="search-icon" />
            <input className="search-input" placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-chips">
            {categories.map(cat => (
              <button key={cat} className={`filter-chip ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>{cat}</button>
            ))}
          </div>
        </div>
        <motion.button
          className="chat-send"
          style={{ width: 'auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}
          onClick={() => setShowAddForm(!showAddForm)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'Cancel' : 'Add Transaction'}
        </motion.button>
      </motion.div>

      {/* Add Transaction Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} /> New Transaction
              </h3>
              
              {/* Type Toggle */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  className={`filter-chip ${newTx.type === 'expense' ? 'active' : ''}`}
                  onClick={() => setNewTx(prev => ({ ...prev, type: 'expense' }))}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ArrowDownRight size={14} /> Expense
                </button>
                <button
                  className={`filter-chip ${newTx.type === 'income' ? 'active' : ''}`}
                  onClick={() => setNewTx(prev => ({ ...prev, type: 'income' }))}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ArrowUpRight size={14} /> Income
                </button>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Description</label>
                  <input
                    className="chat-input"
                    style={{ width: '100%' }}
                    placeholder="e.g., Swiggy Order, Salary..."
                    value={newTx.name}
                    onChange={e => setNewTx(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Category</label>
                  <select
                    className="chat-input"
                    style={{ width: '100%' }}
                    value={newTx.category}
                    onChange={e => setNewTx(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Amount (₹)</label>
                  <input
                    type="number"
                    className="chat-input"
                    style={{ width: '100%' }}
                    placeholder="500"
                    value={newTx.amount}
                    onChange={e => setNewTx(prev => ({ ...prev, amount: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addTransaction()}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <motion.button
                    className="chat-send"
                    style={{ width: 'auto', padding: '0 24px', height: '42px' }}
                    onClick={addTransaction}
                    disabled={adding || !newTx.name.trim() || !newTx.amount}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {adding ? 'Adding...' : 'Add'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="transaction-list">
        {filtered.map(tx => {
          const IconComp = iconMap[tx.icon] || Coffee;
          return (
            <motion.div key={tx.id} variants={item} className="glass-card transaction-item" whileHover={{ x: 4, transition: { duration: 0.2 } }}>
              <div className="tx-left">
                <div className={`tx-icon ${tx.amount > 0 ? 'tx-icon--income' : 'tx-icon--expense'}`}>
                  <IconComp size={18} strokeWidth={1.8} />
                </div>
                <div className="tx-details">
                  <span className="tx-name">{tx.name}</span>
                  <span className="tx-category">{tx.category}</span>
                </div>
              </div>
              <div className="tx-right">
                <span className={`tx-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                  {tx.amount > 0 ? '+' : ''}<InlineEditAmount value={Math.abs(tx.amount)} onSave={(val) => updateTransaction(tx.id, tx.amount > 0 ? Math.abs(val) : -Math.abs(val))} />
                </span>
                <div className="tx-meta">
                  <span className="tx-date">{tx.date}</span>
                  <span className={`tx-status tx-status--${tx.status.toLowerCase()}`}>{tx.status}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No transactions found. Add your first one!
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default TransactionsPage;
