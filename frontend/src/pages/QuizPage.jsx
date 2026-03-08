import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = '';

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// Simple 5‑question personality quiz (yes/no answers)
const QUESTIONS = [
  { id: 1, text: "I often splurge on food or entertainment without thinking." },
  { id: 2, text: "I always set a monthly budget and stick to it." },
  { id: 3, text: "I keep track of every rupee I spend." },
  { id: 4, text: "I feel anxious when I see my bank balance drop." },
  { id: 5, text: "I prefer saving for big goals rather than daily luxuries." },
];

function QuizPage({ sessionId, onComplete }) {
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));
  const [submitting, setSubmitting] = useState(false);

  const handleAnswer = (idx, value) => {
    const newAns = [...answers];
    newAns[idx] = value;
    setAnswers(newAns);
  };

  const allAnswered = answers.every(a => a !== null);

  const submitQuiz = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      // Convert boolean answers to simple true/false list for backend
      const boolAnswers = answers.map(v => !!v);
      await axios.post(`${API_BASE}/api/finance/onboard/${sessionId}`, {
        income: 0, // placeholder – real income will be entered later on dashboard
        expenses: {},
        quiz_answers: boolAnswers,
        language: 'English',
      });
      // The backend will set `personality` based on these answers.
      if (onComplete) onComplete();
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="quiz-page glass-card" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <motion.h2 variants={item} style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px' }}>Financial Personality Quiz</motion.h2>
      {QUESTIONS.map((q, i) => (
        <motion.div key={q.id} variants={item} className="quiz-question" style={{ marginBottom: '12px' }}>
          <p style={{ marginBottom: '6px', color: 'var(--text-secondary)' }}>{q.text}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className={`filter-chip ${answers[i] === true ? 'active' : ''}`}
              onClick={() => handleAnswer(i, true)}
            >Yes</button>
            <button
              className={`filter-chip ${answers[i] === false ? 'active' : ''}`}
              onClick={() => handleAnswer(i, false)}
            >No</button>
          </div>
        </motion.div>
      ))}
      <motion.button
        variants={item}
        className="chat-send"
        style={{ marginTop: '20px', padding: '0 24px', height: '42px' }}
        onClick={submitQuiz}
        disabled={!allAnswered || submitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {submitting ? <Loader2 className="spinning" size={16} /> : <CheckCircle size={16} />}
        {submitting ? 'Submitting...' : 'Finish Quiz'}
      </motion.button>
    </motion.div>
  );
}

export default QuizPage;
