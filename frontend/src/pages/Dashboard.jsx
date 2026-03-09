import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FiPlus, FiEdit2, FiTrash2, FiCreditCard, FiTrendingUp, FiTarget, FiAlertTriangle } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import ExpenseForm from '../components/ExpenseForm';
import BudgetModal from '../components/BudgetModal';
import ConfirmModal from '../components/ConfirmModal';

// Chart color palette — softer, modern palette
const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];

// Custom tooltip for charts
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="custom-tooltip">
      {label && <p style={{ marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{label}</p>}
      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
        ₹{parseFloat(payload[0].value).toFixed(2)}
      </p>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, categoryWise: [], monthlyTrend: [], recent: [] });
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, expRes, budgetRes] = await Promise.all([
        api.get(`/expenses/stats?month=${filterMonth}`),
        api.get(`/expenses?month=${filterMonth}&page=${page}&limit=8`),
        api.get(`/budget?month=${filterMonth}`)
      ]);
      setStats(statsRes.data);
      setExpenses(expRes.data.expenses || []);
      setTotalPages(Math.ceil((expRes.data.total || 0) / (expRes.data.limit || 8)));
      setBudget(budgetRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filterMonth, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── HANDLERS ─────────────────────────────────────────────
  const handleExpenseSubmit = async (formData) => {
    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, formData);
        toast.success('Expense updated!');
      } else {
        await api.post('/expenses', formData);
        toast.success('Expense added!');
      }
      setShowExpenseForm(false);
      setEditingExpense(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      setDeletingId(confirmDeleteId);
      const res = await api.delete(`/expenses/${confirmDeleteId}`);
      if (res.data.success) {
        toast.success('Expense deleted');
        fetchData();
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleBudgetSubmit = async (amount) => {
    try {
      await api.post('/budget', { month: filterMonth, amount });
      toast.success('Budget saved!');
      setShowBudgetModal(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to save budget');
    }
  };

  const openEdit = (expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  // ── DERIVED DATA ──────────────────────────────────────────
  const totalSpent = parseFloat(stats.total || 0);
  const budgetAmt = budget?.budget ? parseFloat(budget.budget.amount) : 0;
  const budgetPct = budget?.percentage || 0;
  const budgetExceeded = budget?.exceeded || false;
  const displayMonth = format(parseISO(filterMonth + '-01'), 'MMMM yyyy');

  return (
    <div style={s.page}>
      {/* ── PAGE HEADER ── */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Dashboard</h1>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>{displayMonth}</p>
        </div>
        <div style={s.headerActions}>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
            className="form-input"
            style={{ height: '38px', padding: '0 0.75rem', fontSize: '0.85rem' }}
          />
          <button
            className="btn btn-primary"
            onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }}
          >
            <FiPlus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <div style={s.metricsGrid}>
        {/* Total Spent */}
        <div className="card fade-in-up" style={{ ...s.metricCard, animationDelay: '0ms' }}>
          <div style={s.metricTop}>
            <span style={{ ...s.metricIcon, background: 'var(--accent-light)', color: 'var(--accent)' }}>
              <FiCreditCard size={18} />
            </span>
            <span className="badge">This month</span>
          </div>
          <p className="text-secondary" style={s.metricLabel}>Total Spent</p>
          <p style={s.metricValue}>₹{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Budget Card */}
        <div className="card fade-in-up" style={{ ...s.metricCard, animationDelay: '60ms' }}>
          <div style={s.metricTop}>
            <span style={{ ...s.metricIcon, background: budgetExceeded ? 'var(--danger-light)' : 'var(--success-light)', color: budgetExceeded ? 'var(--danger)' : 'var(--success)' }}>
              {budgetExceeded ? <FiAlertTriangle size={18} /> : <FiTarget size={18} />}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowBudgetModal(true)}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
            >
              {budgetAmt > 0 ? 'Edit' : 'Set'}
            </button>
          </div>
          <p className="text-secondary" style={s.metricLabel}>Monthly Budget</p>
          {budgetAmt > 0 ? (
            <>
              <p style={{ ...s.metricValue, color: budgetExceeded ? 'var(--danger)' : 'inherit' }}>
                ₹{budgetAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <div style={s.progressWrap}>
                <div
                  style={{
                    ...s.progressFill,
                    width: `${Math.min(budgetPct, 100)}%`,
                    background: budgetExceeded ? 'var(--danger)' : budgetPct > 75 ? 'var(--warning)' : 'var(--success)'
                  }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: budgetExceeded ? 'var(--danger)' : 'var(--text-muted)', marginTop: '0.4rem' }}>
                {budgetExceeded
                  ? `⚠ Over by ₹${Math.abs(budget.remaining).toFixed(2)}`
                  : `₹${budget.remaining.toFixed(2)} remaining · ${budgetPct.toFixed(0)}% used`}
              </p>
            </>
          ) : (
            <>
              <p style={{ ...s.metricValue, color: 'var(--text-muted)' }}>Not set</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Click "Set" to add a monthly limit
              </p>
            </>
          )}
        </div>

        {/* Transaction count */}
        <div className="card fade-in-up" style={{ ...s.metricCard, animationDelay: '120ms' }}>
          <div style={s.metricTop}>
            <span style={{ ...s.metricIcon, background: '#fdf4ff', color: '#a855f7' }}>
              <FiTrendingUp size={18} />
            </span>
          </div>
          <p className="text-secondary" style={s.metricLabel}>Transactions</p>
          <p style={s.metricValue}>{stats.categoryWise.reduce((a, c) => a + parseInt(c.count), 0)}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {stats.categoryWise.length} categor{stats.categoryWise.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={s.chartsGrid}>
        {/* Donut chart */}
        <div className="card">
          <h3 style={s.cardTitle}>Category Breakdown</h3>
          <p className="text-muted" style={s.cardSubtitle}>{displayMonth}</p>
          {stats.categoryWise.length > 0 ? (
            <>
              <div style={{ height: 220, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryWise.map(d => ({ ...d, value: parseFloat(d.total) }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats.categoryWise.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div style={s.legend}>
                {stats.categoryWise.map((cat, i) => (
                  <div key={i} style={s.legendItem}>
                    <div style={{ ...s.legendDot, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span style={{ fontSize: '0.78rem' }}>{cat.category}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{parseFloat(cat.total).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={s.emptyChart}>No spending data for {displayMonth}.</div>
          )}
        </div>

        {/* Bar chart */}
        <div className="card">
          <h3 style={s.cardTitle}>6-Month Trend</h3>
          <p className="text-muted" style={s.cardSubtitle}>Monthly spending over time</p>
          {stats.monthlyTrend.length > 0 ? (
            <div style={{ height: 280, marginTop: '1.25rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.monthlyTrend.map(d => ({ ...d, total: parseFloat(d.total) }))}
                  barCategoryGap="35%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v) => format(parseISO(`${v}-01`), 'MMM')}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    tickFormatter={(v) => `₹${v}`}
                    dx={-4}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'var(--surface-2)', radius: 4 }}
                  />
                  <Bar
                    dataKey="total"
                    fill="var(--accent)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={s.emptyChart}>No historical data yet.</div>
          )}
        </div>
      </div>

      {/* ── EXPENSES TABLE ── */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={s.tableHeader}>
          <div>
            <h3 style={s.cardTitle}>Expenses</h3>
            <p className="text-muted" style={s.cardSubtitle}>{displayMonth}</p>
          </div>
        </div>

        {loading && expenses.length === 0 ? (
          <div style={s.emptyChart}>Loading…</div>
        ) : expenses.length > 0 ? (
          <>
            <div className="table-wrapper" style={{ marginTop: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="text-secondary" style={{ fontSize: '0.8rem' }}>
                        {format(parseISO(exp.expense_date), 'MMM dd, yyyy')}
                      </td>
                      <td style={{ fontWeight: 500 }}>{exp.title}</td>
                      <td>
                        <span className="badge">{exp.category}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ₹{parseFloat(exp.amount).toFixed(2)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                          <button
                            className="icon-btn"
                            title="Edit"
                            onClick={() => openEdit(exp)}
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            className="icon-btn danger"
                            title="Delete"
                            disabled={deletingId === exp.id}
                            onClick={() => setConfirmDeleteId(exp.id)}
                            style={{ opacity: deletingId === exp.id ? 0.5 : 1 }}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={s.pagination}>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Previous
                </button>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ ...s.emptyChart, flexDirection: 'column', gap: '1rem', padding: '3rem 1rem' }}>
            <p className="text-muted">No expenses for {displayMonth}.</p>
            <button
              className="btn btn-primary"
              onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }}
            >
              <FiPlus size={14} /> Log your first expense
            </button>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {showExpenseForm && (
        <ExpenseForm
          initialData={editingExpense}
          onSubmit={handleExpenseSubmit}
          onClose={() => { setShowExpenseForm(false); setEditingExpense(null); }}
        />
      )}
      {showBudgetModal && (
        <BudgetModal
          currentMonth={displayMonth}
          currentBudget={budget?.budget?.amount || ''}
          onSubmit={handleBudgetSubmit}
          onClose={() => setShowBudgetModal(false)}
        />
      )}
      {confirmDeleteId && (
        <ConfirmModal
          title="Delete Expense"
          message="Are you sure you want to delete this expense? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteId(null)}
          isLoading={deletingId === confirmDeleteId}
        />
      )}
    </div>
  );
};

// ── LOCAL STYLES ──────────────────────────────────────────────
const s = {
  page: { paddingBottom: '3rem' },

  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.75rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  pageTitle: { fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px' },
  headerActions: { display: 'flex', gap: '0.75rem', alignItems: 'center' },

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  metricCard: { minHeight: '160px' },
  metricTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  metricIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: { fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' },
  metricValue: { fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 },

  progressWrap: {
    marginTop: '0.75rem',
    height: '6px',
    background: 'var(--surface-2)',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: '99px', transition: 'width 0.5s ease' },

  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '1rem',
  },
  cardTitle: { fontSize: '0.95rem', fontWeight: 700 },
  cardSubtitle: { fontSize: '0.78rem', marginTop: '0.2rem' },
  emptyChart: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
  },

  legend: {
    marginTop: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: '160px',
    overflowY: 'auto',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.2rem 0',
  },
  legendDot: { width: '10px', height: '10px', borderRadius: '3px', flexShrink: 0 },

  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.25rem',
    marginTop: '1.25rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border)',
  },
};

export default Dashboard;
