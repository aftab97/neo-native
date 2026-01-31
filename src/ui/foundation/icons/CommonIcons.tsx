import React from 'react';
import Svg, { Path, Circle, Line, Rect, G, Defs, ClipPath } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const PlusIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChatIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MenuIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12h18M3 6h18M3 18h18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SendIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 2L15 22L11 13L2 9L22 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const StopIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="4"
      y="4"
      width="16"
      height="16"
      rx="2"
      fill={color}
    />
  </Svg>
);

export const MoonIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SunIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
    <Line x1="12" y1="1" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="1" y1="12" x2="3" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="21" y1="12" x2="23" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BellIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const HistoryIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path
      d="M12 6v6l4 2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CameraIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
  </Svg>
);

export const FileIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2v6h6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
    <Path
      d="M21 21l-4.35-4.35"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ImageIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2" />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
    <Path
      d="M21 15l-5-5L5 21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const GlobeIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path
      d="M2 12h20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LinkIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Feedback icons
export const CopyIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 10l5 5 5-5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15V3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ThumbsUpIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ThumbsDownIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ThumbsUpFilledIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 20V11a2 2 0 0 1 2-2h3v13H4a2 2 0 0 1-2-2Z"
      fill={color}
    />
    <Path
      d="M7 22V9l4-9a3 3 0 0 1 3 3v5h5.66a2 2 0 0 1 2 2.3l-1.38 9a2 2 0 0 1-2 1.7H7Z"
      fill={color}
    />
  </Svg>
);

export const ThumbsDownFilledIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 4v7a2.31 2.31 0 0 1-2.33 2H17V2h2.67A2.31 2.31 0 0 1 22 4Z"
      fill={color}
    />
    <Path
      d="M17 2v11l-4 9a3 3 0 0 1-3-3v-4H4.34a2 2 0 0 1-2-2.3l1.38-9A2 2 0 0 1 5.72 2H17Z"
      fill={color}
    />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Source icon - matches web app's source-icon.svg
export const SourceIcon: React.FC<IconProps> = ({ size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <G strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <Path
        stroke="#005786"
        d="M6 2H2.667A.667.667 0 0 0 2 2.667V6c0 .368.298.667.667.667H6A.667.667 0 0 0 6.667 6V2.667A.667.667 0 0 0 6 2ZM6 9.333H2.667A.667.667 0 0 0 2 10v3.333c0 .368.298.667.667.667H6a.667.667 0 0 0 .667-.667V10A.667.667 0 0 0 6 9.333Z"
      />
      <Path
        stroke="#2B88BA"
        d="M9.333 2.667H14M9.333 6H14M9.333 10H14M9.333 13.333H14"
      />
    </G>
  </Svg>
);

// Google logo - matches web app's google-logo.svg
export const GoogleLogo: React.FC<IconProps> = ({ size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <Path
      fill="#FBC02D"
      d="M10.902 5.02h-.403V5H6v2h2.826a2.999 2.999 0 1 1-2.826-4c.765 0 1.46.288 1.99.76l1.415-1.414A4.977 4.977 0 0 0 5.999 1a5 5 0 1 0 4.903 4.02Z"
    />
    <Path
      fill="#E53935"
      d="M1.576 3.673 3.22 4.878A2.999 2.999 0 0 1 5.999 3c.766 0 1.461.288 1.991.76l1.414-1.414A4.977 4.977 0 0 0 6 1a4.997 4.997 0 0 0-4.424 2.673Z"
    />
    <Path
      fill="#4CAF50"
      d="M6.001 11a4.977 4.977 0 0 0 3.352-1.298l-1.547-1.31A2.977 2.977 0 0 1 6 9c-1.3 0-2.405-.83-2.82-1.986L1.55 8.27A4.996 4.996 0 0 0 6 11Z"
    />
    <Path
      fill="#1565C0"
      d="M10.903 5.02 10.899 5H6v2h2.826a3.01 3.01 0 0 1-1.022 1.393l1.548 1.309C9.242 9.802 11 8.5 11 6c0-.335-.034-.662-.097-.98Z"
    />
  </Svg>
);

// File spreadsheet icon - used in source modal (matches lucide FileSpreadsheet)
export const FileSpreadsheetIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2v6h6"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 13h2M8 17h2M12 13h4M12 17h4"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Settings/Gear icon
export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Chevron Right icon
export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Logout icon
export const LogoutIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 17l5-5-5-5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 12H9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Trash icon
export const TrashIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Language/Globe icon (reusing GlobeIcon but adding as alias for clarity)
export const LanguageIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path
      d="M2 12h20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// User/Person icon
export const UserIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
  </Svg>
);

// Briefcase/Job icon
export const BriefcaseIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke={color} strokeWidth="2" />
    <Path
      d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Map Pin/Location icon
export const MapPinIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
  </Svg>
);

// Building/Business Unit icon
export const BuildingIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 21h18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 21V7l8-4v18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 21V11l-6-3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// Hash/ID icon
export const HashIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="9" x2="20" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="4" y1="15" x2="20" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="10" y1="3" x2="8" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="16" y1="3" x2="14" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Email/Mail icon
export const EmailIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 6l-10 7L2 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Phone icon
export const PhoneIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Shuffle icon - used for routing status (matches lucide Shuffle)
export const ShuffleIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 3h5v5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4 20L21 3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 16v5h-5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 15l6 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4 4l5 5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Chevron Down icon
export const ChevronDownIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9l6 6 6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Help Circle icon - for Help & Support section
export const HelpCircleIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path
      d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 17h.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Info icon - for Support option
export const InfoIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path
      d="M12 16v-4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 8h.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Rocket icon - for Get Started option
export const RocketIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Alert Circle icon - generic alert
export const AlertCircleIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path
      d="M12 8v4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 16h.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Issue icon - speech bubble with exclamation mark (for Report an Issue) - matches web issue.svg
export const IssueIcon: React.FC<IconProps> = ({ size = 20, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <G clipPath="url(#clip0_issue)">
      <Path
        d="M2.49438 13.6174C2.61691 13.9265 2.64419 14.2652 2.57271 14.5899L1.68521 17.3316C1.65661 17.4706 1.66401 17.6147 1.70669 17.75C1.74937 17.8854 1.82593 18.0077 1.9291 18.1052C2.03227 18.2027 2.15864 18.2722 2.29621 18.3071C2.43379 18.3421 2.57801 18.3413 2.71521 18.3049L5.55938 17.4733C5.86581 17.4125 6.18315 17.439 6.47521 17.5499C8.2547 18.3809 10.2705 18.5568 12.167 18.0464C14.0635 17.536 15.7188 16.3721 16.8408 14.7602C17.9628 13.1483 18.4795 11.1919 18.2996 9.23622C18.1198 7.2805 17.255 5.45115 15.8578 4.07092C14.4606 2.6907 12.6208 1.84829 10.663 1.69234C8.70526 1.53639 6.75532 2.07691 5.15725 3.21854C3.55917 4.36017 2.41565 6.02955 1.92846 7.93212C1.44126 9.8347 1.64169 11.8482 2.49438 13.6174Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 6.66602V9.99935"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 13.334H10.0088"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_issue">
        <Rect width="20" height="20" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

// External Link icon - for external links
export const ExternalLinkIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 3h6v6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 14L21 3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Neo Logo Text - matches web neo-logo-text.svg
export const NeoLogoText: React.FC<{ width?: number; height?: number; color?: string }> = ({
  width = 70,
  height = 20,
  color = '#646b82'
}) => (
  <Svg width={width} height={height} viewBox="0 0 70 20" fill="none">
    <Path
      fill={color}
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.613 19.878c-1.485 0-2.829-.858-3.507-2.24L9.51 12.344l-.001-.003L7.62 8.49l-.423-.862C6.49 6.18 5.782 4.734 5.07 3.29c-.256-.52-.647-.774-1.194-.774-.04 0-.079 0-.118.005-.527.033-.897.299-1.097.79a2.098 2.098 0 0 0-.128.779c-.004 2.76-.005 5.518-.006 8.276v5.917c0 .738-.3 1.186-.915 1.366a1.233 1.233 0 0 1-1.563-.91 2.148 2.148 0 0 1-.046-.477V15.03C.002 11.34.001 7.651.005 3.962.008 1.94 1.38.327 3.343.04 3.526.013 3.71 0 3.893 0c1.476 0 2.81.848 3.484 2.211.66 1.34 1.317 2.68 1.974 4.021l.242.494.521 1.065.002.004.001.002.778 1.588c1.168 2.38 2.335 4.76 3.501 7.142.276.565.666.83 1.224.832.745 0 1.33-.572 1.333-1.303.004-1.125.004-2.264.004-3.38V1.513c.001-.768.542-1.347 1.258-1.347.156 0 .313.03.467.087.493.183.792.627.799 1.185.006.477.006.962.006 1.436V8.894l.001 2.114v.526a732.84 732.84 0 0 1-.004 4.42c-.011 2.039-1.347 3.6-3.323 3.885-.181.027-.365.04-.546.04h-.002Zm30.761-2.785C48.336 18.995 51.11 20 54.393 20h-.002 4.726c3.284 0 6.057-1.006 8.019-2.909a8.958 8.958 0 0 0 2.137-3.225c.484-1.22.729-2.526.729-3.856s-.252-2.654-.727-3.826a9.34 9.34 0 0 0-2.138-3.255C65.175 1.027 62.401.021 59.12.021h-4.726c-3.283 0-6.056 1.006-8.022 2.912a9.827 9.827 0 0 0-2.162 3.253 10.822 10.822 0 0 0-.7 3.826c0 1.31.236 2.605.703 3.858a9.408 9.408 0 0 0 2.162 3.223Zm-.342-7.081c0-4.61 3.154-7.473 8.23-7.473h4.989c5.076 0 8.23 2.863 8.23 7.473 0 4.61-3.154 7.472-8.23 7.472h-4.989c-5.076 0-8.23-2.863-8.23-7.472Zm-21.345 9.65h15.1v.002h.162c.049 0 .162-.001.256-.013a1.272 1.272 0 0 0 1.107-1.306c-.029-.706-.595-1.2-1.377-1.2H25.683l-.002-.734c-.003-.789-.006-1.604.01-2.403.007-.319.058-.649.15-.956.417-1.388 1.617-2.252 3.132-2.256h9.363c.404 0 .717-.003 1.013-.01a1.246 1.246 0 0 0 1.2-1.088 1.261 1.261 0 0 0-.841-1.343 2.046 2.046 0 0 0-.635-.09c-1.682-.002-3.364-.002-5.046-.002-1.682 0-3.364.001-5.046.004a5.815 5.815 0 0 0-1.169.103c-2.773.577-4.642 2.869-4.65 5.704v4.057c0 1.045.485 1.532 1.525 1.532ZM23.177 6.51c.002.805.52 1.39 1.234 1.39h.012c.35-.004.683-.146.918-.388.247-.254.373-.6.365-.998a47.16 47.16 0 0 1-.013-1.681l.001-.175c.002-.22.003-.488.003-.856V2.745h7.283l7.236-.001c.422-.002.793-.142 1.044-.398.229-.232.348-.537.342-.884C41.591.73 41.035.237 40.218.237H24.59c-.897 0-1.412.507-1.414 1.386-.003 1.975-.003 2.702 0 4.53v.356Z"
    />
  </Svg>
);

// File Text icon - for Terms & Policies (document with dotted lines) - matches web file.svg
export const FileTextIcon: React.FC<IconProps> = ({ size = 20, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 21 20" fill="none">
    <Path
      d="M13.333 1.667h-7.5a1.667 1.667 0 0 0-1.666 1.666v13.334a1.667 1.667 0 0 0 1.666 1.666h10a1.667 1.667 0 0 0 1.667-1.666V5.833l-4.167-4.166Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.5 1.667V5a1.667 1.667 0 0 0 1.667 1.667H17.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.5 10.833h1.667M12.5 10.833h1.667M7.5 14.167h1.667M12.5 14.167h1.667"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Prompt Library icon - document with edit pencil - matches web prompt-library.svg
export const PromptLibraryIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 25 24" fill="none">
    <Path
      d="M11.32 9h-3m3.21 3H8.3m7.02 3h-7m12.31-2.79v2.8a4.2 4.2 0 0 1-4.2 4.2h-7.7a4.2 4.2 0 0 1-4.2-4.2V8.25a4.2 4.2 0 0 1 4.2-4.2h5.8"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Path
      d="M19.17 4.4a1.38 1.38 0 0 1 1.95 1.96l-3.9 3.91a1.3 1.3 0 0 1-.56.33l-1.87.54a.32.32 0 0 1-.4-.4l.54-1.87c.06-.2.18-.4.33-.55l3.91-3.92Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Search Web icon - globe with meridians - matches web SearchWeb.svg
export const SearchWebIcon: React.FC<IconProps> = ({ size = 24, color = '#646b82' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.09 4c-2.91 2.16-4.54 5.02-4.54 8 0 2.98 1.63 5.84 4.54 8 2.9-2.16 4.53-5.02 4.53-8 0-2.98-1.62-5.84-4.53-8Z"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 8s3.14 2 7 2c3.62 0 7-1.8 7-1.8m0 7.76s-3.14-1.58-7-1.58c-3.62 0-7 1.39-7 1.39"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 4.89V20"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </Svg>
);
