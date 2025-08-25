import React from 'react';

interface FiestaIconProps {
  className?: string;
}

export const FiestaIcon: React.FC<FiestaIconProps> = ({ className = "h-6 w-6" }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Party hat */}
      <path d="M16 2L12 14H20L16 2Z" fill="currentColor" opacity="0.8"/>
      <circle cx="16" cy="2" r="2" fill="currentColor"/>
      
      {/* Face */}
      <circle cx="16" cy="20" r="10" fill="currentColor" opacity="0.6"/>
      
      {/* Eyes */}
      <circle cx="13" cy="17" r="1.5" fill="currentColor" opacity="0.9"/>
      <circle cx="19" cy="17" r="1.5" fill="currentColor" opacity="0.9"/>
      
      {/* Smile */}
      <path 
        d="M12 22C12 24 14 25 16 25C18 25 20 24 20 22" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none" 
        strokeLinecap="round"
        opacity="0.9"
      />
      
      {/* Confetti */}
      <rect x="6" y="8" width="2" height="2" fill="currentColor" transform="rotate(45 7 9)" opacity="0.7"/>
      <rect x="26" y="12" width="2" height="2" fill="currentColor" transform="rotate(45 27 13)" opacity="0.7"/>
      <rect x="4" y="18" width="2" height="2" fill="currentColor" transform="rotate(45 5 19)" opacity="0.7"/>
      <rect x="28" y="22" width="2" height="2" fill="currentColor" transform="rotate(45 29 23)" opacity="0.7"/>
      
      {/* Party streamers */}
      <path 
        d="M2 6C4 8 6 6 8 8" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none" 
        strokeLinecap="round"
        opacity="0.6"
      />
      <path 
        d="M24 6C26 8 28 6 30 8" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none" 
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
};
