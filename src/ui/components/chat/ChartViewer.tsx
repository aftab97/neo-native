import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLayoutStore } from '../../../store';
import { colors } from '../../foundation/colors/colors';

interface ChartViewerProps {
  /** Vega-Lite specification as a JSON string or object */
  spec: string | object;
  /** Optional width override */
  width?: number;
  /** Optional height override */
  height?: number;
}

/**
 * ChartViewer - Renders Vega-Lite charts using WebView
 *
 * Uses Vega-Embed to render Vega-Lite specifications in a WebView.
 * Supports both light and dark themes.
 */
export const ChartViewer: React.FC<ChartViewerProps> = ({
  spec,
  width,
  height = 300,
}) => {
  const isDarkTheme = useLayoutStore((state) => state.isDarkTheme);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = width || screenWidth - 64; // Account for padding

  // Parse spec if it's a string
  const specObject = useMemo(() => {
    if (typeof spec === 'string') {
      try {
        return JSON.parse(spec);
      } catch (e) {
        console.error('[ChartViewer] Failed to parse spec:', e);
        return null;
      }
    }
    return spec;
  }, [spec]);

  // Generate HTML for WebView
  const html = useMemo(() => {
    if (!specObject) return '';

    const backgroundColor = isDarkTheme ? colors.gray['900'] : '#ffffff';
    const textColor = isDarkTheme ? colors.gray['100'] : colors.gray['900'];

    // Modify spec for theme
    const themedSpec = {
      ...specObject,
      width: chartWidth - 40, // Account for WebView padding
      height: height - 40,
      background: backgroundColor,
      config: {
        ...specObject.config,
        background: backgroundColor,
        title: {
          color: textColor,
          ...specObject.config?.title,
        },
        axis: {
          labelColor: textColor,
          titleColor: textColor,
          gridColor: isDarkTheme ? colors.gray['700'] : colors.gray['200'],
          domainColor: isDarkTheme ? colors.gray['600'] : colors.gray['300'],
          tickColor: isDarkTheme ? colors.gray['600'] : colors.gray['300'],
          ...specObject.config?.axis,
        },
        legend: {
          labelColor: textColor,
          titleColor: textColor,
          ...specObject.config?.legend,
        },
        view: {
          stroke: 'transparent',
          ...specObject.config?.view,
        },
      },
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: ${backgroundColor};
      overflow: hidden;
    }
    #chart {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .vega-embed {
      width: 100% !important;
    }
    .vega-embed .vega-actions {
      display: none !important;
    }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script>
    const spec = ${JSON.stringify(themedSpec)};

    vegaEmbed('#chart', spec, {
      actions: false,
      renderer: 'svg',
      theme: '${isDarkTheme ? 'dark' : 'default'}'
    }).then(function(result) {
      // Chart rendered successfully
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'ready' }));
    }).catch(function(error) {
      console.error('Vega-Embed error:', error);
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: error.message }));
    });
  </script>
</body>
</html>
`;
  }, [specObject, isDarkTheme, chartWidth, height]);

  if (!specObject) {
    return null;
  }

  return (
    <View style={[styles.container, { height, backgroundColor: isDarkTheme ? colors.gray['900'] : '#ffffff' }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'error') {
              console.error('[ChartViewer] Render error:', data.message);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
