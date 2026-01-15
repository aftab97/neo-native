import { useLayoutStore } from '../store';
import { semantic, colors } from '../theme/colors';

/**
 * Hook to get theme-aware colors
 */
export const useTheme = () => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const theme = useLayoutStore((state) => state.theme);
  const setTheme = useLayoutStore((state) => state.setTheme);

  // Get current semantic colors based on theme
  const themeColors = isDarkTheme ? semantic.dark : semantic.light;

  return {
    isDarkTheme,
    theme,
    setTheme,
    colors: themeColors,
    rawColors: colors,
  };
};
