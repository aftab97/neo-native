import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePopupStore, Toast as ToastType } from '../../store';

const ToastItem: React.FC<{
  toast: ToastType;
  onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const getBackgroundColor = () => {
    switch (toast.variant) {
      case 'danger':
        return '#fee2e2';
      case 'success':
        return '#dcfce7';
      default:
        return '#21232c';
    }
  };

  const getTextColor = () => {
    switch (toast.variant) {
      case 'danger':
        return '#b91c1c';
      case 'success':
        return '#15803d';
      default:
        return '#ffffff';
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastItem,
        { opacity, backgroundColor: getBackgroundColor() },
      ]}
    >
      <Text style={[styles.toastText, { color: getTextColor() }]}>
        {toast.label}
      </Text>
      {toast.showClose && (
        <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: getTextColor() }]}>×</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export const ToastContainer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { toasts, removeToast } = usePopupStore();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { bottom: insets.bottom + 80 }]}>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    gap: 8,
  },
  toastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    fontWeight: '600',
  },
});
