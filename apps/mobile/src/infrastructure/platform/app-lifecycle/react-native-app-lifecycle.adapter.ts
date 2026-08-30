import type {
  AppLifecyclePort,
  AppLifecycleState,
} from '@/application';
import { AppState, type AppStateStatus } from 'react-native';

const mapAppState = (state: AppStateStatus): AppLifecycleState =>
  state === 'active' ? 'active' : 'background';

export class ReactNativeAppLifecycleAdapter implements AppLifecyclePort {
  getCurrentState(): AppLifecycleState {
    return mapAppState(AppState.currentState);
  }

  subscribe(listener: (state: AppLifecycleState) => void): () => void {
    const subscription = AppState.addEventListener('change', (state) => {
      listener(mapAppState(state));
    });
    return () => subscription.remove();
  }
}
