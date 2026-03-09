import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];

const ExpenseForm = ({ initialData, onSubmit, onClose }) => {
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Food',
    expense_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title,
        amount: initialData.amount,
        category: initialData.category,
        expense_date: new Date(initialData.expense_date).toISOString().split('T')[0]
      });
    }
  }, [initialData]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter a valid amount');
    if (!form.expense_date) return toast.error('Date is required');
    onSubmit(form);
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={modalHeader}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {initialData ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Grocery run"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                className="form-input"
                type="number"
                name="amount"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              className="form-input"
              type="date"
              name="expense_date"
              value={form.expense_date}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              {initialData ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 17, 23, 0.45)',
  backdropFilter: 'blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
  animation: 'fadeIn 0.2s ease',
};

const modal = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)',
  width: '100%',
  maxWidth: '460px',
  padding: '1.75rem',
  animation: 'slideIn 0.25s ease',
};

const modalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
};

export default ExpenseForm;
