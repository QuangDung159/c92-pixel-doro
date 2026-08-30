import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export const usePrototypeBack = (onBack: () => void) => {
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => subscription.remove();
  }, [onBack]);
};
