import React from 'react';

export default function LoadingSpinner({ 
  size = "medium", 
  color = "#e53e3e", 
  text = "Loading...",
  showText = true 
}) {
  const sizeMap = {
    small: "16px",
    medium: "24px", 
    large: "32px",
    xlarge: "48px"
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '16px'
    }}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `2px solid rgba(229, 62, 62, 0.2)`,
          borderTop: `2px solid ${color}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {showText && text && (
        <div style={{
          color: color,
          fontSize: '0.9rem',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          {text}
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Button loading state component
export function LoadingButton({ 
  loading, 
  children, 
  loadingText = "Loading...",
  disabled = false,
  ...props 
}) {
  return (
    <button 
      {...props}
      disabled={loading || disabled}
      style={{
        ...props.style,
        position: 'relative',
        opacity: loading ? 0.7 : 1,
        cursor: loading ? 'not-allowed' : 'pointer'
      }}
    >
      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid #fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          {loadingText}
        </div>
      ) : (
        // Only render children, no extra divs
        children
      )}
      {loading && (
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      )}
    </button>
  );
}

// Skeleton loading component for content
export function SkeletonLoader({ 
  lines = 3, 
  height = "20px",
  width = "100%",
  gap = "8px" 
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: gap,
      padding: '16px'
    }}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          style={{
            height: height,
            width: index === lines - 1 ? '60%' : width,
            background: 'linear-gradient(90deg, #333 25%, #444 50%, #333 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '4px',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
} 