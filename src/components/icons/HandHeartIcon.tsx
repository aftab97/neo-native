import React from 'react';
import Svg, { Rect, Path, G, ClipPath, Defs } from 'react-native-svg';

interface IconProps {
  size?: number;
}

export const HandHeartIcon: React.FC<IconProps> = ({ size = 64 }) => {
  // Scale factor to fit 16x16 viewbox content into 64x64 with padding
  const scale = size / 64;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Rect width="64" height="64" fill="#FFE5EA" rx="32" />
      <G transform="translate(16, 16) scale(2)">
        <G clipPath="url(#clip0_hand_heart)">
          <Path
            d="M7.73177 10.4928H9.0651C9.41873 10.4928 9.75786 10.3524 10.0079 10.1023C10.258 9.85227 10.3984 9.51313 10.3984 9.15951C10.3984 8.80588 10.258 8.46674 10.0079 8.2167C9.75786 7.96665 9.41873 7.82617 9.0651 7.82617H7.0651C6.6651 7.82617 6.33177 7.95951 6.13177 8.22617L2.39844 11.8262"
            stroke="#FF6680"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M5.0625 14.4933L6.12917 13.56C6.32917 13.2933 6.6625 13.16 7.0625 13.16H9.72917C10.4625 13.16 11.1292 12.8933 11.5958 12.36L14.6625 9.42668C14.9198 9.18356 15.0699 8.84821 15.0799 8.49439C15.0899 8.14057 14.9589 7.79727 14.7158 7.54001C14.4727 7.28275 14.1374 7.13261 13.7835 7.1226C13.4297 7.1126 13.0864 7.24356 12.8292 7.48668L10.0292 10.0867"
            stroke="#FF6680"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M1.73047 11.1602L5.73047 15.1602"
            stroke="#FF6680"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13.3953 5.82682C13.8619 5.36016 14.3953 4.76016 14.3953 4.02682C14.4419 3.61944 14.3495 3.20826 14.1332 2.85992C13.9169 2.51157 13.5893 2.24647 13.2035 2.10758C12.8177 1.9687 12.3963 1.96416 12.0076 2.0947C11.6189 2.22524 11.2857 2.48322 11.0619 2.82682C10.824 2.50988 10.4906 2.27757 10.1109 2.16401C9.73119 2.05045 9.32505 2.06162 8.95214 2.19587C8.57922 2.33012 8.25916 2.58038 8.03895 2.90992C7.81874 3.23946 7.70997 3.63092 7.72861 4.02682C7.72861 4.82682 8.26195 5.36016 8.72861 5.89349L11.0619 8.16016L13.3953 5.82682Z"
            stroke="#CC0022"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
        <Defs>
          <ClipPath id="clip0_hand_heart">
            <Rect width="16" height="16" fill="white" />
          </ClipPath>
        </Defs>
      </G>
    </Svg>
  );
};
