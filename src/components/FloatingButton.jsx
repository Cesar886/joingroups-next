// components/FloatingButton.jsx
export default function FloatingButton() {
  return (
    <button
      onClick={() => window.history.back()}
      style={{
        position: 'fixed',
        bottom: '20px',
        left:   '20px',
        zIndex: 1000,
        padding: 'auto',
        borderRadius: '0.375rem',
        background: '#228be6',
        color: '#0E4C84',
        backgroundColor: '#E9F1FA',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      ← Back
    </button>
  )
}
