import React from 'react';

interface GearProps {
  size?: number;
  teeth?: number;
  speed?: 'slow' | 'medium' | 'fast';
  reverse?: boolean;
  className?: string;
  color?: string;
}

export const MechanicalGear: React.FC<GearProps> = ({
  size = 48,
  teeth = 12,
  speed = 'slow',
  reverse = false,
  className = '',
  color = '#C19A55'
}) => {
  const radius = size / 2;
  const toothDepth = size * 0.12;
  const innerRadius = radius - toothDepth;
  const axleRadius = size * 0.22;

  // Generate gear teeth path
  const points: string[] = [];
  const angleStep = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const a1 = i * angleStep;
    const a2 = a1 + angleStep * 0.25;
    const a3 = a1 + angleStep * 0.5;
    const a4 = a1 + angleStep * 0.75;

    // Inner point
    points.push(`${radius + innerRadius * Math.cos(a1)},${radius + innerRadius * Math.sin(a1)}`);
    // Outer point 1
    points.push(`${radius + radius * Math.cos(a2)},${radius + radius * Math.sin(a2)}`);
    // Outer point 2
    points.push(`${radius + radius * Math.cos(a3)},${radius + radius * Math.sin(a3)}`);
    // Inner point 2
    points.push(`${radius + innerRadius * Math.cos(a4)},${radius + innerRadius * Math.sin(a4)}`);
  }

  const dPath = `M ${points[0]} L ${points.slice(1).join(' ')} Z`;

  const speedClass = speed === 'fast' ? 'duration-1000' : (speed === 'medium' ? 'duration-3000' : 'duration-8000');
  const animClass = reverse ? 'animate-gear-reverse' : 'animate-gear-slow';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`inline-block ${animClass} ${className}`}
      style={{ animationDuration: speed === 'fast' ? '8s' : (speed === 'medium' ? '20s' : '45s') }}
    >
      <defs>
        <radialGradient id={`gear-grad-${size}`} cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#E8DFC9" />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor="#4A3820" />
        </radialGradient>
      </defs>
      {/* Outer Teeth */}
      <path d={dPath} fill={`url(#gear-grad-${size})`} stroke="#80643C" strokeWidth="1" />
      {/* Middle Rim Ring */}
      <circle cx={radius} cy={radius} r={innerRadius * 0.75} fill="#1E1A14" stroke={color} strokeWidth="1.5" />
      {/* Central Axle Keyway */}
      <circle cx={radius} cy={radius} r={axleRadius} fill={color} />
      <circle cx={radius} cy={radius} r={axleRadius * 0.45} fill="#171512" />
    </svg>
  );
};

