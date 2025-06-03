import React from 'react';

const MapLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] w-full animate-fade-in fixed inset-0 z-50 bg-white/80">
      {/* Out-of-the-box: Animated 3D-style map with a car driving, clouds, and pulsing pins */}
      <svg width="180" height="110" viewBox="0 0 180 110" fill="none" className="mb-4">
        {/* 3D map base */}
        <rect x="20" y="40" width="140" height="40" rx="14" fill="#e0e7ef" stroke="#a3a3a3" strokeWidth="2" />
        {/* Map grid lines */}
        <g stroke="#cbd5e1" strokeWidth="1">
          <line x1="40" y1="50" x2="160" y2="50" />
          <line x1="40" y1="70" x2="160" y2="70" />
          <line x1="60" y1="40" x2="60" y2="80" />
          <line x1="100" y1="40" x2="100" y2="80" />
          <line x1="140" y1="40" x2="140" y2="80" />
        </g>
        {/* Dashed route path */}
        <path id="routePath" d="M40 80 Q90 20 140 80" stroke="#3B82F6" strokeWidth="4" fill="none" strokeDasharray="7 7" />
        {/* Pulsing pins */}
        <g>
          <circle cx="40" cy="80" r="8" fill="#22c55e">
            <animate attributeName="r" values="8;12;8" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.5;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="140" cy="80" r="8" fill="#ef4444">
            <animate attributeName="r" values="8;12;8" dur="1.2s" repeatCount="indefinite" begin="0.6s" />
            <animate attributeName="opacity" values="1;0.5;1" dur="1.2s" repeatCount="indefinite" begin="0.6s" />
          </circle>
        </g>
        {/* Animated car driving along the path */}
        <g>
          <animateMotion dur="2.5s" repeatCount="indefinite">
            <mpath xlinkHref="#routePath" />
          </animateMotion>
          {/* Car body */}
          <rect x="-10" y="-7" width="20" height="14" rx="4" fill="#fbbf24" stroke="#fff" strokeWidth="2" />
          {/* Car roof */}
          <rect x="-6" y="-12" width="12" height="8" rx="2" fill="#3B82F6" />
          {/* Wheels */}
          <circle cx="-6" cy="7" r="3" fill="#222" />
          <circle cx="6" cy="7" r="3" fill="#222" />
        </g>
        {/* Animated clouds */}
        <g>
          <g>
            <animateTransform attributeName="transform" type="translate" from="0,0" to="40,0" dur="3s" repeatCount="indefinite" />
            <ellipse cx="60" cy="30" rx="12" ry="6" fill="#fff" opacity="0.7" />
            <ellipse cx="70" cy="32" rx="7" ry="4" fill="#fff" opacity="0.6" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" from="0,0" to="-30,0" dur="3.5s" repeatCount="indefinite" />
            <ellipse cx="120" cy="25" rx="10" ry="5" fill="#fff" opacity="0.7" />
            <ellipse cx="130" cy="27" rx="6" ry="3" fill="#fff" opacity="0.6" />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default MapLoader;
