import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { AccessibilityInfo } from 'react-native';

import { ReducedMotionStore } from '@/presentation/motion/reduced-motion.store';

const ReducedMotionContext = createContext<ReducedMotionStore | null>(null);

export const ReducedMotionProvider = ({ children }: PropsWithChildren) => {
  const [store] = useState(() => new ReducedMotionStore({
    read: () => AccessibilityInfo.isReduceMotionEnabled(),
    subscribe: (listener) => {
      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        listener,
      );
      return () => subscription.remove();
    },
  }));

  useEffect(() => () => store.dispose(), [store]);

  return (
    <ReducedMotionContext.Provider value={store}>
      {children}
    </ReducedMotionContext.Provider>
  );
};

export const useReducedMotionPreference = (): boolean => {
  const store = useContext(ReducedMotionContext);
  if (store === null) throw new Error('ReducedMotionProvider is missing');
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
};
