import React, { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  content: string;
  title?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, title }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isVisible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // If there's more space below than above, show tooltip below
      if (spaceBelow > spaceAbove && spaceAbove < 200) {
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
  }, [isVisible]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          marginLeft: '5px',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#667eea',
          backgroundColor: '#f0f0f0',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#667eea';
          e.currentTarget.style.color = 'white';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f0f0';
          e.currentTarget.style.color = '#667eea';
        }}
      >
        ?
      </button>
      
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            [position === 'top' ? 'bottom' : 'top']: '25px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#333',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.5',
            maxWidth: '380px',
            minWidth: '300px',
            zIndex: 1000,
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
            whiteSpace: 'normal',
            textAlign: 'left',
            border: '1px solid #555'
          }}
        >
          {title && (
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '8px', 
              color: '#fff',
              fontSize: '14px',
              borderBottom: '1px solid #555',
              paddingBottom: '6px'
            }}>
              {title}
            </div>
          )}
          <div style={{ color: '#e0e0e0' }}>{content}</div>
          <div
            style={{
              position: 'absolute',
              [position === 'top' ? 'top' : 'bottom']: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              ...(position === 'top' 
                ? { borderTop: '8px solid #333' }
                : { borderBottom: '8px solid #333' }
              )
            }}
          />
        </div>
      )}
    </div>
  );
};

export default InfoTooltip; 