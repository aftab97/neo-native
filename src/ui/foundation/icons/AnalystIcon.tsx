import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
}

export const AnalystIcon: React.FC<IconProps> = ({ size = 64 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Rect width="64" height="64" fill="#F3F7FD" rx="32" />
      <Path
        stroke="#2A88BA"
        strokeLinecap="round"
        strokeWidth="3"
        d="M10.75 44.243h23"
      />
      <Path
        fill="#2A88BA"
        d="M19.89 28.543h-5.84a1 1 0 0 0-1 1v13.68a1 1 0 0 0 1 1h5.84a1 1 0 0 0 1-1v-13.68a1 1 0 0 0-1-1ZM31.09 22.197h-5.84a1 1 0 0 0-1 1v20.026a1 1 0 0 0 1 1h6.04a1 1 0 0 0 .85-1.528l-.793-1.274a9 9 0 0 1-.484-8.62l1.13-2.374a1 1 0 0 0 .097-.43v-6.8a1 1 0 0 0-1-1ZM42 14.243h-6a1 1 0 0 0-1 1v12.305a1 1 0 0 0 1.32.947l.36-.122a1 1 0 0 1 .321-.053h3.077a1 1 0 0 1 .595.197l.731.542A1 1 0 0 0 43 28.256V15.243a1 1 0 0 0-1-1Z"
      />
      <Circle
        cx="38.437"
        cy="36.757"
        r="8.207"
        stroke="#005786"
        strokeWidth="3"
      />
      <Path
        stroke="#005786"
        strokeLinecap="round"
        strokeWidth="3"
        d="m45.157 43.663 5.093 5.094"
      />
    </Svg>
  );
};
