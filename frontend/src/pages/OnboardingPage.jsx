import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, IndianRupee, Wallet, TrendingUp, CheckCircle, Activity, HeartPulse, ShieldCheck, Zap } from 'lucide-react';
import axios from 'axios';

const API_BASE = ''; 

const quizQuestions = [
  "Do you often find yourself splurging on 'Sale' items you don't really need?",
  "Do you track every single UPI or cash spend manually today?",
  "Do you have a rock-solid 3-month emergency fund ready in the bank?",
  "Is your philosophy to 'Save First' and then survive on the rest?",
  "Have you ever missed a major EMI or credit card payment deadline?"
];

const categories = ["Housing/Rent", "Food & Groceries", "Transport/Fuel", "Utilities/Bills", "Shopping/Lifestyle", "Entertainment", "Savings/Investments", "Debt/EMI"];

function OnboardingPage({ sessionId, onComplete }) {
  const [step, setStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState(new Array(quizQuestions.length).fill(false));
  const [language, setLanguage] = useState("English");
  const [income, setIncome] = useState("50000");
  const [expenses, setExpenses] = useState(categories.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {}));
  const [loading, setLoading] = useState(false);

  const handleQuizToggle = (i) => {
    const newAns = [...quizAnswers];
    newAns[i] = !newAns[i];
    setQuizAnswers(newAns);
  };

  const handleExpenseChange = (cat, val) => {
    setExpenses(prev => ({ ...prev, [cat]: Number(val) }));
  };

  const submitOnboarding = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/finance/onboard/${sessionId}`, {
        income: Number(income),
        expenses,
        quiz_answers: quizAnswers,
        language
      });
      setTimeout(() => {
        setLoading(false);
        onComplete();
      }, 1500);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 1000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '24px'
    }}>
      <AnimatePresence mode="wait">
        
        {step === 1 && (
          <motion.div key="1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', padding: '10px', borderRadius: '12px', color: 'white' }}>
                 <Sparkles size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Voodo AI Coach</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>Personalizing your financial engine</p>
              </div>
            </div>
            
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '24px', fontWeight: '500' }}>Answer these 5 quick questions correctly to calibrate your AI Advisor:</p>
            
            <div className="ob-quiz-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {quizQuestions.map((q, i) => (
                <div key={i} className="ob-quiz-item" onClick={() => handleQuizToggle(i)} style={{ 
                  padding: '16px', background: quizAnswers[i] ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-input)', 
                  borderRadius: '16px', border: '1px solid', borderColor: quizAnswers[i] ? 'var(--accent-purple)' : 'var(--border-subtle)',
                  cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center', transition: 'all 0.2s'
                }}>
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '6px', border: '2px solid', 
                    borderColor: quizAnswers[i] ? 'var(--accent-purple)' : 'var(--text-muted)',
                    background: quizAnswers[i] ? 'var(--accent-purple)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                  }}>
                    {quizAnswers[i] && <CheckCircle size={14} />}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: quizAnswers[i] ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{q}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', display: 'block' }}>Coach's Voice Language</label>
              <select className="chat-input" value={language} onChange={e => setLanguage(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'white' }}>
                <option value="English">English (Global)</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
              </select>
            </div>

            <button className="btn-primary" style={{ width: '100%', padding: '16px' }} onClick={() => setStep(2)}>
              Calibrate Intelligence <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="glass-card" style={{ maxWidth: '800px', width: '100%', padding: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IndianRupee style={{ color: 'var(--accent-purple)' }} /> Financial Numbers
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Enter your monthly averages to build your spending baseline.</p>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Monthly Total Income (In-Hand)</label>
              <div style={{ position: 'relative' }}>
                <IndianRupee size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input type="number" value={income} onChange={e => setIncome(e.target.value)} className="chat-input" style={{ width: '100%', paddingLeft: '48px', height: '56px', fontSize: '20px', fontWeight: '800' }} placeholder="0" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '40px' }}>
              {categories.map(cat => (
                <div key={cat}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', opacity: 0.7 }}>{cat}</label>
                  <input type="number" value={expenses[cat]} onChange={e => handleExpenseChange(cat, e.target.value)} className="chat-input" style={{ width: '100%', height: '44px', fontWeight: '700' }} placeholder="₹0" />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-subtle)', boxShadow: 'none' }} onClick={() => setStep(1)}>Go Back</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={submitOnboarding} disabled={loading}>
                {loading ? "Optimizing Database..." : "Build My Command Center"}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export default OnboardingPage;
