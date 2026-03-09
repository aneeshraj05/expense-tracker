import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

const ConfirmModal = ({ title, message, onConfirm, onCancel, isLoading }) => {
  return (
    <div style={overlay} onClick={(e) => { if(e.target === e.currentTarget && !isLoading) onCancel(); }}>
      <div style={modal}>
        <div style={header}>
          <div style={iconWrap}>
            <FiAlertTriangle size={20} color="var(--danger)" />
          </div>
          <button className="icon-btn" onClick={onCancel} disabled={isLoading}><FiX size={18} /></button>
        </div>
        
        <h3 style={titleStyle}>{title}</h3>
        <p style={messageStyle}>{message}</p>
        
        <div style={actions}>
          <button className="btn btn-ghost" onClick={onCancel} disabled={isLoading} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn" onClick={onConfirm} disabled={isLoading} style={{ ...dangerBtn, flex: 1 }}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
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
  maxWidth: '380px',
  padding: '1.5rem',
  animation: 'slideIn 0.25s ease',
};

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
};

const iconWrap = {
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  background: 'var(--danger-light)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const titleStyle = {
  fontSize: '1.25rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: '0.5rem',
  letterSpacing: '-0.3px',
};

const messageStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
  marginBottom: '1.5rem',
};

const actions = {
  display: 'flex',
  gap: '0.75rem',
};

const dangerBtn = {
  background: 'var(--danger)',
  color: '#fff',
  border: 'none',
};

export default ConfirmModal;
