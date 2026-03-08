import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Ghost, Flame, Target, Sparkles, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const API_BASE = '';

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } } };

function BadHabitsPage({ sessionId }) {
  const [nudges, setNudges] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      setLoading(true);
      axios.get(`${API_BASE}/api/finance/habits/${sessionId}`)
        .then(res => setNudges(res.data.nudges))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [sessionId]);

  return (
    <motion.div variants={container} initial="hidden" animate="visible" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <motion.div variants={item} style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '10px', 
          background: 'rgba(239, 68, 68, 0.1)', padding: '8px 16px', 
          borderRadius: '100px', color: '#ef4444', marginBottom: '16px' 
        }}>
          <Ghost size={18} />
          <span style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Vices & Leakage Detection</span>
        </div>
        <h2 style={{ fontSize: '36px', fontWeight: '800', margin: 0 }}>Financial Habits Radar</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '12px', maxWidth: '600px', margin: '12px auto' }}>
          Our AI scans your transaction velocity and category spikes to find habits that are silently eating your long-term wealth.
        </p>
      </motion.div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <ShieldAlert size={48} className="spinning" style={{ color: '#ef4444', opacity: 0.5 }} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {nudges.length === 0 && !loading && (
          <motion.div variants={item} className="glass-card" style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center' }}>
            <Sparkles size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Pure Habits Detected!</h3>
            <p style={{ color: 'var(--text-muted)' }}>You've kept your spending strictly within your limits this cycle. The Coach is impressed.</p>
          </motion.div>
        )}

        {nudges.map((n, idx) => (
          <motion.div 
            key={idx} 
            variants={item} 
            className="glass-card" 
            whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(239, 68, 68, 0.1)' }}
            style={{ 
              padding: '24px', 
              background: 'linear-gradient(135deg, var(--bg-card), rgba(239, 68, 68, 0.03))',
              borderLeft: '4px solid #ef4444'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#ef4444', padding: '8px', borderRadius: '10px', color: 'white' }}>
                  <Flame size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{n.category}</h3>
                  <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '800', textTransform: 'uppercase' }}>High Risk Detected</span>
                </div>
              </div>
            </div>
            
            <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px', fontWeight: '500' }}>
              {n.message}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px' }}>
              <Target size={16} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>Coach's Counter-Action available in Chat</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default BadHabitsPage;
