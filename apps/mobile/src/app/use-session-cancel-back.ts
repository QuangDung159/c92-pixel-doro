import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export const useSessionCancelBack = (onBack: () => void) => {
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [onBack]);
};
