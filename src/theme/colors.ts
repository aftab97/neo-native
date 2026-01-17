// Color tokens matching the web app's CSS variables exactly
// Source: neo3-ui/src/ui/styles/variables/colors.css

export const colors = {
  // Gray scale (exact match from web)
  gray: {
    '000': '#ffffff',
    '012': '#fbfcfd',
    '025': '#f9fafb',
    '050': '#f5f6f9',
    '100': '#f0f2f6',
    '200': '#e2e5ee',
    '300': '#cfd4e2',
    '400': '#929aaf',
    '500': '#646b82',
    '600': '#4c5366',
    '700': '#363b49',
    '800': '#2b2f3b',
    '900': '#21232c',
    '925': '#191a21',
    '950': '#111216',
    '1000': '#000000',
  },

  // Blue (primary brand)
  blue: {
    '100': '#ebf2fa',
    '200': '#d4e5f7',
    '300': '#a8ccf0',
    '400': '#7db2e8',
    '500': '#5299e0',
    '600': '#1773cf',
    '700': '#0a66c2',
    '800': '#044d95',
  },

  // Red (danger/error)
  red: {
    '100': '#ffe5ea',
    '200': '#ffccd4',
    '300': '#ff99aa',
    '400': '#ff6680',
    '500': '#eb4763',
    '600': '#e61c3d',
    '700': '#cc0022',
    '800': '#99001a',
  },

  // Yellow (warning)
  yellow: {
    '100': '#fff7e5',
    '200': '#ffeecc',
    '300': '#ffdd99',
    '400': '#ffcc66',
    '500': '#e6a800',
    '600': '#cc9600',
    '700': '#997000',
    '800': '#664b00',
  },

  // Green (success)
  green: {
    '100': '#e5fff0',
    '200': '#ccffe0',
    '300': '#99ffc2',
    '400': '#66ffa3',
    '500': '#00cc5c',
    '600': '#00b352',
    '700': '#008f41',
    '800': '#006b31',
  },

  // Purple (agent icons)
  purple: {
    '100': '#f4ebff',
    '500': '#7e1fad',
    '600': '#ad5cd6',
    '700': '#610f8a',
  },

  // Teal
  teal: {
    '500': '#14b8a6',
    '700': '#0f766e',
  },
} as const;

// Semantic color tokens
export const semantic = {
  light: {
    surface: {
      canvas: colors.gray['100'],
      primary: colors.gray['000'],
      secondary: colors.gray['025'],
      tertiary: colors.gray['050'],
      accent: colors.blue['700'],
    },
    text: {
      primary: colors.gray['900'],
      secondary: colors.gray['700'],
      tertiary: colors.gray['500'],
      disabled: colors.gray['400'],
      link: colors.blue['700'],
    },
    border: {
      primary: colors.gray['200'],
      secondary: colors.gray['300'],
      focus: colors.blue['500'],
    },
    button: {
      primary: {
        bg: colors.blue['700'],
        text: colors.gray['000'],
        hover: colors.blue['800'],
      },
      secondary: {
        bg: colors.gray['100'],
        text: colors.gray['900'],
        hover: colors.gray['200'],
      },
      danger: {
        bg: colors.red['100'],
        text: colors.red['700'],
        hover: colors.red['700'],
      },
    },
  },
  dark: {
    surface: {
      canvas: colors.gray['950'],
      primary: colors.gray['1000'],
      secondary: colors.gray['900'],
      tertiary: colors.gray['800'],
      accent: colors.blue['500'],
    },
    text: {
      primary: colors.gray['100'],
      secondary: colors.gray['300'],
      tertiary: colors.gray['400'],
      disabled: colors.gray['600'],
      link: colors.blue['400'],
    },
    border: {
      primary: colors.gray['800'],
      secondary: colors.gray['700'],
      focus: colors.blue['400'],
    },
    button: {
      primary: {
        bg: colors.blue['600'],
        text: colors.gray['000'],
        hover: colors.blue['500'],
      },
      secondary: {
        bg: colors.gray['800'],
        text: colors.gray['100'],
        hover: colors.gray['700'],
      },
      danger: {
        bg: colors.red['700'],
        text: colors.gray['000'],
        hover: colors.red['500'],
      },
    },
  },
} as const;

// Code syntax highlighting colors (matching web)
export const codeColors = {
  light: {
    background: '#1e1e1e',
    inlineCode: {
      bg: colors.gray['100'],
      text: colors.gray['900'],
    },
  },
  dark: {
    background: '#1e1e1e',
    inlineCode: {
      bg: colors.gray['800'],
      text: colors.gray['100'],
    },
  },
} as const;

// Neo brand gradient colors
export const gradients = {
  neo: ['#2457a4', '#12abdb'] as const,
  purple: ['#8b5cf6', '#6d28d9'] as const,
};
