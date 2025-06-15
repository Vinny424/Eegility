// Custom SVG Icons for EEGility
import React from 'react'

export interface IconProps {
  size?: number | string
  color?: string
  className?: string
  style?: React.CSSProperties
}

// Brain Wave Icon
export const BrainWaveIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className, 
  ...props 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 2C8 2 5 5 5 9c0 3 2 5 4 6v5a1 1 0 001 1h4a1 1 0 001-1v-5c2-1 4-3 4-6 0-4-3-7-7-7z" />
    <path d="M8 9c0-2 2-4 4-4s4 2 4 4" />
    <path d="M6 15l2-1 2 1 2-1 2 1 2-1 2 1" />
  </svg>
)

// EEG Electrode Icon
export const ElectrodeIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className, 
  ...props 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="8" r="6" />
    <circle cx="12" cy="8" r="2" fill={color} />
    <path d="M12 14v4" />
    <path d="M8 18h8" />
    <path d="M10 20h4" />
  </svg>
)

// Signal Wave Icon
export const SignalWaveIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className, 
  ...props 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M2 12h3l3-6 4 12 4-12 3 6h3" />
    <circle cx="2" cy="12" r="1" fill={color} />
    <circle cx="22" cy="12" r="1" fill={color} />
  </svg>
)

// ADHD Brain Icon
export const ADHDBrainIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className, 
  ...props 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 2C8 2 5 5 5 9c0 3 2 5 4 6v5a1 1 0 001 1h4a1 1 0 001-1v-5c2-1 4-3 4-6 0-4-3-7-7-7z" />
    <circle cx="9" cy="8" r="1" fill={color} />
    <circle cx="15" cy="8" r="1" fill={color} />
    <path d="M9 11c1 1 3 1 4 0" />
    <path d="M7 15l1-1 1 1 1-1 1 1 1-1 1 1 1-1 1 1" strokeWidth="1.5" />
  </svg>
)

// Data Upload Icon
export const DataUploadIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className, 
  ...props 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7,10 12,5 17,10" />
    <line x1="12" y1="5" x2="12" y2="15" />
    <path d="M8 8l-2 2h4z" fill={color} />
    <path d="M16 8l2 2h-4z" fill={color} />
  </svg>
)

// Analysis Chart Icon
export const AnalysisChartIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className, 
  ...props 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <path d="M8 12l2-2 3 3 4-4" />
    <circle cx="8" cy="12" r="1" fill={color} />
    <circle cx="10" cy="10" r="1" fill={color} />
    <circle cx="13" cy="13" r="1" fill={color} />
    <circle cx="17" cy="9" r="1" fill={color} />
  </svg>
)

// Device Connection Icon
export const DeviceIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className, 
  ...props 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="2" y="6" width="20" height="12" rx="2" ry="2" />
    <circle cx="7" cy="12" r="2" />
    <circle cx="17" cy="12" r="2" />
    <path d="M12 8v8" />
    <path d="M8 8v8" />
    <path d="M16 8v8" />
  </svg>
)

// Patient Profile Icon
export const PatientIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className, 
  ...props 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 00-16 0" />
    <circle cx="9" cy="7" r="1" fill={color} />
    <circle cx="15" cy="7" r="1" fill={color} />
    <path d="M9 10h6" />
    <rect x="10" y="5" width="4" height="1" fill={color} />
  </svg>
)

// BIDS Folder Icon
export const BidsFolderIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className, 
  ...props 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    <text x="12" y="14" textAnchor="middle" fontSize="8" fill={color}>BIDS</text>
  </svg>
)

// Real-time Stream Icon
export const StreamIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor', 
  className, 
  ...props 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="2" fill={color} />
    <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z" opacity="0.3" />
    <path d="M12 2c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" opacity="0.2" />
  </svg>
)

// Export all icons
export const Icons = {
  BrainWave: BrainWaveIcon,
  Electrode: ElectrodeIcon,
  SignalWave: SignalWaveIcon,
  ADHDBrain: ADHDBrainIcon,
  DataUpload: DataUploadIcon,
  AnalysisChart: AnalysisChartIcon,
  Device: DeviceIcon,
  Patient: PatientIcon,
  BidsFolder: BidsFolderIcon,
  Stream: StreamIcon,
}