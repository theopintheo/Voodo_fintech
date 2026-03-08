import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Calendar, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function GoalsPage({ sessionId }) {
  const [goals, setGoals] = useState([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('3 months');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [sessionId]);

  const fetchGoals = () => {
    if (sessionId) {
      axios.get(`/api/finance/goals/${sessionId}`)
           .then(res => setGoals(res.data))
           .catch(console.error);
    }
  };

  const createGoal = async () => {
    if (!name || !amount) return;
    setLoading(true);
    try {
      await axios.post(`/api/finance/goals/${sessionId}`, {
        name,
        target_amount: Number(amount),
        target_date: date
      });
      fetchGoals();
      setName('');
      setAmount('');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const deleteGoal = async (goalId) => {
    try {
      await axios.delete(`/api/finance/goals/${sessionId}/${goalId}`);
      fetchGoals();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="goals-page">
      <motion.div variants={item} className="section-header">
        <h2>Savings Goals & Trackers</h2>
        <span className="section-count">{goals.length} Active</span>
      </motion.div>

      {/* Goal Creator Form */}
      <motion.div variants={item} className="glass-card goal-creator" style={{ marginBottom: '24px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Target size={20} className="chat-icon" /> Set a New Goal</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Goal Name (e.g., MacBook, Manali Trip)</label>
            <input className="chat-input" style={{ width: '100%', marginTop: '8px' }} value={name} onChange={e => setName(e.target.value)} placeholder="Emergency Fund" />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Target Amount (₹)</label>
            <input type="number" className="chat-input" style={{ width: '100%', marginTop: '8px' }} value={amount} onChange={e => setAmount(e.target.value)} placeholder="50000" />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Time Horizon</label>
            <select className="chat-input" style={{ width: '100%', marginTop: '8px' }} value={date} onChange={e => setDate(e.target.value)}>
              <option value="1 month">1 Month</option>
              <option value="3 months">3 Months</option>
              <option value="6 months">6 Months</option>
              <option value="12 months">1 Year</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="chat-send" style={{ width: 'auto', padding: '0 24px' }} onClick={createGoal} disabled={loading}>{loading ? 'Saving...' : 'Create Roadmap'}</button>
          </div>
        </div>
      </motion.div>

      {/* Goal List */}
      <div className="goals-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {goals.map((goal, idx) => (
          <motion.div key={goal.id} variants={item} className="glass-card goal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{goal.name}</h3>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Goal: ₹{goal.target_amount.toLocaleString('en-IN')} in {goal.target_date}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => deleteGoal(goal.id)}
                  style={{ background: 'transparent', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="Delete Goal"
                >
                  <AlertCircle size={18} />
                </button>
                <div className="account-icon account-icon--purple"><Sparkles size={20} /></div>
              </div>
            </div>
            
            <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--accent-teal)' }}>Your Customized Week-by-Week Roadmap</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {goal.weekly_plan.map((week, wIdx) => (
                <div key={wIdx} className="week-card" style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Week {week.week}</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-teal)' }}>Save ₹{Math.round(week.amount).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Total est: ₹{Math.round(week.cumulative).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default GoalsPage;
