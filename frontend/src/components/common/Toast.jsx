import React from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  const bgColors = {
    info: '#1e293b',
    success: '#065f46',
    warning: '#854d0e',
    error: '#991b1b'
  };

  const borderColors = {
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      backgroundColor: bgColors[type] || bgColors.info,
      color: '#ffffff',
      borderLeft: `4px solid ${borderColors[type] || borderColors.info}`,
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '0.9rem',
      fontWeight: 500,
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '1.1rem',
            lineHeight: 1
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Toast;
