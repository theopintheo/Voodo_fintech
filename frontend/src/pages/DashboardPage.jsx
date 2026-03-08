import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Send, Bot, Sparkles, Download, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);

const API_BASE = '';

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const fmt = (v) => {
  if (v === undefined || v === null) return '₹0';
  if (typeof v === 'string') return '₹' + parseFloat(v).toLocaleString('en-IN');
  return '₹' + v.toLocaleString('en-IN');
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }} className="chart-tooltip-value">{e.name}: {fmt(e.value)}</p>
      ))}
    </div>
  );
}

function DashboardPage({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const chatEndRef = useRef(null);
  
  const [data, setData] = useState(() => {
    const cached = localStorage.getItem(`voodo_dashboard_${sessionId}`);
    return cached ? JSON.parse(cached) : null;
  });

  useEffect(() => {
    if (sessionId) {
      Promise.all([
        axios.get(`${API_BASE}/api/finance/dashboard/${sessionId}`),
        axios.get(`${API_BASE}/api/chat/${sessionId}/history`),
        axios.get(`${API_BASE}/api/chat/${sessionId}/insight`)
      ]).then(([dashboard, chat, insight]) => {
        setData(dashboard.data);
        setMessages(chat.data);
        setAiInsight(insight.data.insight);
        localStorage.setItem(`voodo_dashboard_${sessionId}`, JSON.stringify(dashboard.data));
      }).catch(console.error);
    }
  }, [sessionId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/chat/${sessionId}/message`, { message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const [viewMonths, setViewMonths] = useState(6);
  const [showByBudget, setShowByBudget] = useState(false);
  const [viewFrequency, setViewFrequency] = useState('monthly');

  // ---- PDF Export ----
  const exportPDF = async () => {
    if (!data) return;
    setExportingPDF(true);
    
    try {
      const doc = new jsPDF();
      applyPlugin(doc.constructor);
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 92, 246); // Purple
      doc.text('Financial Report Card', pageWidth / 2, y, { align: 'center' });
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, y, { align: 'center' });
      y += 12;

      // Divider line
      doc.setDrawColor(139, 92, 246);
      doc.setLineWidth(0.5);
      doc.line(20, y, pageWidth - 20, y);
      y += 12;

      // Summary Cards Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Financial Summary', 20, y);
      y += 10;

      // Summary table
      doc.autoTable({
        startY: y,
        head: [['Metric', 'Value']],
        body: [
          ['Total Balance', `Rs. ${Number(data.balance).toLocaleString('en-IN')}`],
          ['Monthly Income', `Rs. ${Number(data.income).toLocaleString('en-IN')}`],
          ['Monthly Spending', `Rs. ${Number(data.spending).toLocaleString('en-IN')}`],
          ['Savings Rate', `${data.income > 0 ? Math.round((1 - data.spending / data.income) * 100) : 0}%`],
          ['Health Score', `${data.health_score}/100`],
          ['Grade', data.grade],
          ['Personality', data.personality],
        ],
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 246, 255] },
        styles: { fontSize: 11, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
        margin: { left: 20, right: 20 },
      });
      y = doc.lastAutoTable.finalY + 15;

      // Spending History Table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('6-Month Spending History', 20, y);
      y += 10;

      if (data.spending_data && data.spending_data.length > 0) {
        doc.autoTable({
          startY: y,
          head: [['Month', 'Income', 'Spending', 'Savings']],
          body: data.spending_data.map(row => [
            row.month,
            `Rs. ${Math.round(row.income).toLocaleString('en-IN')}`,
            `Rs. ${Math.round(row.spending).toLocaleString('en-IN')}`,
            `Rs. ${Math.round(row.income - row.spending).toLocaleString('en-IN')}`,
          ]),
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [240, 253, 244] },
          styles: { fontSize: 10, cellPadding: 4 },
          margin: { left: 20, right: 20 },
        });
        y = doc.lastAutoTable.finalY + 15;
      }

      // Budget Breakdown (Fetch budgets)
      try {
        const budgetRes = await axios.get(`${API_BASE}/api/finance/budgets/${sessionId}`);
        const budgets = budgetRes.data;
        
        if (budgets && budgets.length > 0) {
          if (y > 240) {
            doc.addPage();
            y = 20;
          }
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(40, 40, 40);
          doc.text('Budget Breakdown', 20, y);
          y += 10;

          doc.autoTable({
            startY: y,
            head: [['Category', 'Spent', 'Limit', 'Usage', 'Status']],
            body: budgets.map(b => {
              const pct = Math.round((b.spent / b.limit) * 100);
              return [
                b.category,
                `Rs. ${b.spent.toLocaleString('en-IN')}`,
                `Rs. ${b.limit.toLocaleString('en-IN')}`,
                `${pct}%`,
                pct >= 100 ? 'EXCEEDED' : pct >= 85 ? 'WARNING' : 'ON TRACK',
              ];
            }),
            theme: 'grid',
            headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [255, 251, 235] },
            styles: { fontSize: 10, cellPadding: 4 },
            margin: { left: 20, right: 20 },
            didParseCell: function(data) {
              if (data.column.index === 4 && data.section === 'body') {
                if (data.cell.text[0] === 'EXCEEDED') {
                  data.cell.styles.textColor = [220, 38, 38];
                  data.cell.styles.fontStyle = 'bold';
                } else if (data.cell.text[0] === 'WARNING') {
                  data.cell.styles.textColor = [217, 119, 6];
                  data.cell.styles.fontStyle = 'bold';
                } else {
                  data.cell.styles.textColor = [22, 163, 74];
                  data.cell.styles.fontStyle = 'bold';
                }
              }
            }
          });
          y = doc.lastAutoTable.finalY + 15;
        }
      } catch (e) {
        console.error('Failed to fetch budgets for PDF:', e);
      }

      // Footer
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('Voodo FinTech — AI Personal Finance Coach', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      }

      doc.save(`Finance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
    }
    setExportingPDF(false);
  };

  if (!data) return <div style={{ color: "var(--text-muted)", padding: "20px" }}>Loading dashboard...</div>;

  const cards = [
    { title: 'Total Balance', value: fmt(data.balance), change: 'current sync', trend: 'up', icon: IndianRupee, color: 'purple' },
    { title: 'Monthly Income', value: fmt(data.income), change: 'current sync', trend: 'up', icon: TrendingUp, color: 'teal' },
    { title: 'Monthly Spending', value: fmt(data.spending), change: 'current sync', trend: 'down', icon: TrendingDown, color: 'amber' },
  ];

  const chartData = (viewFrequency === 'monthly' ? data.spending_data?.slice(-viewMonths) : data.weekly_data) || [];
  const xAxisKey = viewFrequency === 'monthly' ? 'month' : 'week';

  const currentMonthData = data.spending_data && data.spending_data.length > 0 ? data.spending_data[data.spending_data.length - 1] : null;
  const pieData = currentMonthData ? (Object.keys(data.category_colors || {}).map(cat => ({
    name: cat,
    value: currentMonthData[cat] || 0,
    color: data.category_colors[cat]
  })).filter(item => item.value > 0)) : [];

  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      {/* Export PDF Button */}
      <motion.div variants={item} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <motion.button
          onClick={exportPDF}
          disabled={exportingPDF}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            color: 'white', border: 'none', cursor: exportingPDF ? 'wait' : 'pointer',
            fontSize: '14px', fontWeight: '600',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
            transition: 'all 0.2s',
          }}
          whileHover={{ scale: 1.03, boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)' }}
          whileTap={{ scale: 0.97 }}
        >
          {exportingPDF ? <Loader2 size={16} className="spinning" /> : <Download size={16} />}
          {exportingPDF ? 'Generating...' : 'Export PDF Report'}
        </motion.button>
      </motion.div>

      <motion.div variants={item} className="glass-card" style={{ 
        marginBottom: '24px', padding: '20px', 
        borderLeft: '4px solid #8b5cf6', display: 'flex', 
        alignItems: 'center', gap: '16px', background: 'rgba(139, 92, 246, 0.05)' 
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', 
          width: '40px', height: '40px', borderRadius: '12px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' 
        }}>
          <Sparkles size={24} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', color: '#8b5cf6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coach's Daily Insight</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: 'var(--text-primary)', fontWeight: '500' }}>
            {aiInsight || "Analyzing your spending patterns to give you the perfect advice..."}
          </p>
        </div>
      </motion.div>

      <div className="summary-grid">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={i} variants={item} className={`glass-card summary-card`} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <div className="summary-card-header">
                <span className="summary-card-title">{c.title}</span>
                <div className={`summary-card-icon summary-card-icon--${c.color}`}><Icon size={18} strokeWidth={1.8} /></div>
              </div>
              <div className="summary-card-value">{c.value}</div>
              <div className={`summary-card-change ${c.trend === 'up' ? 'positive' : 'negative'}`}>
                {c.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{c.change}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div variants={item} className="glass-card" style={{ marginBottom: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} className="chat-icon" /> Monthly Report Card
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', marginBottom: '16px' }}>
            Based on your responses, you are categorized as a <strong>{data.personality}</strong>. 
            Here is your financial health status based on standard guidelines.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: '900', color: data.health_score > 70 ? 'var(--accent-teal)' : 'var(--accent-amber)' }}>
              {data.health_score}
            </div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Health Score</div>
          </div>
          <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: '900', color: data.grade === 'A+' || data.grade === 'A' ? 'var(--accent-purple)' : 'var(--text-primary)' }}>
              {data.grade}
            </div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Letter Grade</div>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <motion.div variants={item} className="glass-card chart-card" style={{ marginBottom: 0 }}>
          <div className="chart-header" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 className="chart-title">Spending Analysis</h2>
              <span className="chart-subtitle">
                {viewFrequency === 'monthly' ? `${viewMonths}-month overview` : 'Current month (4 weeks)'} {showByBudget ? '(By Category)' : '(Total)'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="filter-chips">
                <button className={`filter-chip ${viewFrequency === 'monthly' ? 'active' : ''}`} onClick={() => setViewFrequency('monthly')}>Monthly</button>
                <button className={`filter-chip ${viewFrequency === 'weekly' ? 'active' : ''}`} onClick={() => setViewFrequency('weekly')}>Weekly</button>
              </div>
              <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />
              <div className="filter-chips">
                <button className={`filter-chip ${!showByBudget ? 'active' : ''}`} onClick={() => setShowByBudget(false)}>Total</button>
                <button className={`filter-chip ${showByBudget ? 'active' : ''}`} onClick={() => setShowByBudget(true)}>By Budget</button>
              </div>
              {viewFrequency === 'monthly' && (
                <>
                  <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />
                  <div className="filter-chips">
                    {[1, 2, 3, 4, 5, 6].map(m => (
                      <button key={m} className={`filter-chip ${viewMonths === m ? 'active' : ''}`} onClick={() => setViewMonths(m)}>
                        {m}M
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey={xAxisKey} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v/1000}k`} />
              <Tooltip content={<ChartTooltip />} />
              {showByBudget && data.category_colors ? (
                Object.keys(data.category_colors).map((cat, i) => (
                  <Area 
                    key={cat} 
                    stackId="1" 
                    type="monotone" 
                    dataKey={cat} 
                    stroke={data.category_colors[cat]} 
                    fill={data.category_colors[cat]} 
                    fillOpacity={0.4} 
                    name={cat} 
                  />
                ))
              ) : (
                <>
                  <Area type="monotone" dataKey="income" stroke="#8b5cf6" strokeWidth={2} fill="url(#gIncome)" name="Income" />
                  <Area type="monotone" dataKey="spending" stroke="#10b981" strokeWidth={2} fill="url(#gSpend)" name="Spending" />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="glass-card chart-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="chart-header">
            <div>
              <h2 className="chart-title">Spending Breakdown</h2>
              <span className="chart-subtitle">{currentMonthData?.month || 'Current Month'}</span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {pieData.length > 0 ? (
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  No spending data this month
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div variants={item} className="glass-card chat-card">
        <div className="chat-header">
          <div className="chat-header-title">
            <Sparkles size={20} strokeWidth={1.8} className="chat-icon" />
            <h2>FinAI Assistant</h2>
          </div>
          <span className="chat-subtitle">Your personal finance advisor</span>
        </div>
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <Bot size={40} strokeWidth={1} className="chat-empty-icon" />
              <p>Ask me anything about your finances!</p>
              <span>Budgeting, savings tips, investment advice & more.</span>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message chat-message--${msg.role}`}>
              <div className={`chat-avatar chat-avatar--${msg.role}`}>
                {msg.role === 'user' ? 'U' : <Bot size={16} />}
              </div>
              <div className="chat-bubble"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message chat-message--assistant">
              <div className="chat-avatar chat-avatar--assistant"><Bot size={16} /></div>
              <div className="chat-bubble"><div className="typing-indicator"><span /><span /><span /></div></div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input-container">
          <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type your financial question..." />
          <button className="chat-send" onClick={sendMessage} disabled={isLoading || !input.trim()}><Send size={18} strokeWidth={1.8} /></button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default DashboardPage;
