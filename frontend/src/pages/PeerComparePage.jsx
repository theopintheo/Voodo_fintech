import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, Zap, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const API_BASE = '';

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function PeerComparePage({ sessionId }) {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      setLoading(true);
      axios.get(`${API_BASE}/api/finance/peer-compare/${sessionId}`)
        .then(res => setComparison(res.data.comparison))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [sessionId]);

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="glass-card" style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <motion.div variants={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '10px', borderRadius: '12px', color: 'white' }}>
          <Users size={24} />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Social Peer Benchmark</h2>
      </motion.div>

      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <TrendingUp size={48} className="spinning" style={{ opacity: 0.2, marginBottom: '16px' }} />
          <p>Connecting to the Voodo Network benchmarks...</p>
        </div>
      )}

      {comparison && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <motion.div variants={item} className="glass-card" style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.05em', marginBottom: '8px' }}>Your Savings Rate</h3>
            <div style={{ fontSize: '48px', fontWeight: '900', color: 'var(--text-primary)' }}>{comparison.user_savings_rate}%</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Based on your last 30 days of income and spending.</p>
          </motion.div>

          <motion.div variants={item} className="glass-card" style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#3b82f6', letterSpacing: '0.05em', marginBottom: '8px' }}>Peer Average</h3>
            <div style={{ fontSize: '48px', fontWeight: '900', color: 'var(--text-primary)' }}>{comparison.peer_average_rate}%</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Average savings of users with a similar '{comparison.personality || 'Balanced'}' profile.</p>
          </motion.div>

          <motion.div variants={item} style={{ gridColumn: '1 / -1', padding: '20px', borderRadius: '16px', background: comparison.above_peer ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 96, 105, 0.1))' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: comparison.above_peer ? '#10b981' : '#f59e0b' }}>
              {comparison.above_peer ? <Zap size={32} /> : <AlertCircle size={32} />}
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: '700' }}>{comparison.above_peer ? "Elite Performer!" : "Efficiency Opportunity"}</h4>
              <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
                {comparison.above_peer ? "You are out-saving 82% of users in your demographic. Keep this momentum!" : "You are slightly below the peer average. The AI Coach can help you identify 'Leakage' categories."}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default PeerComparePage;
