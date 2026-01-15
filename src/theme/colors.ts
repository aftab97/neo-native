// Color tokens matching the web app's CSS variables
// These can be used programmatically when NativeWind classes aren't sufficient

export const colors = {
  // Gray scale
  gray: {
    '000': '#ffffff',
    '012': '#fbfcfd',
    '025': '#f9fafb',
    '050': '#f4f5f6',
    '100': '#eceef0',
    '200': '#e0e3e6',
    '300': '#c7ccd1',
    '400': '#9ea6ae',
    '500': '#6e7a85',
    '600': '#5d6872',
    '700': '#4b555e',
    '800': '#3a424a',
    '900': '#21232c',
    '950': '#17191f',
    '1000': '#000000',
  },

  // Blue accent
  blue: {
    '100': '#e6f2ff',
    '200': '#b3d9ff',
    '300': '#80c0ff',
    '400': '#4da6ff',
    '500': '#1a8cff',
    '600': '#0073e6',
    '700': '#0158ab',
    '800': '#004080',
    '900': '#002b57',
  },

  // Red (danger/error)
  red: {
    '100': '#fee2e2',
    '400': '#f87171',
    '500': '#ef4444',
    '700': '#b91c1c',
  },

  // Green (success)
  green: {
    '100': '#dcfce7',
    '400': '#4ade80',
    '500': '#22c55e',
    '700': '#15803d',
  },

  // Yellow (warning)
  yellow: {
    '100': '#fef9c3',
    '400': '#facc15',
    '500': '#eab308',
    '700': '#a16207',
  },

  // Purple
  purple: {
    '500': '#8b5cf6',
    '700': '#6d28d9',
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

// Neo brand gradient colors
export const gradients = {
  neo: ['#2457a4', '#12abdb'] as const,
  purple: ['#8b5cf6', '#6d28d9'] as const,
};
