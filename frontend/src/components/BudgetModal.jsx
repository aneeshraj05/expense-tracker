import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const BudgetModal = ({ currentMonth, currentBudget, onSubmit, onClose }) => {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (currentBudget) setAmount(currentBudget);
  }, [currentBudget]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onSubmit(amount);
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={header}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Monthly Budget</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Set a spending limit for {currentMonth}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}><FiX size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Budget Amount (₹)</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1000.00"
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Save Budget</button>
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
  maxWidth: '420px',
  padding: '1.75rem',
  animation: 'slideIn 0.25s ease',
};

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1.5rem',
};

export default BudgetModal;
