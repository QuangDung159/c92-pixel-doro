import { useAppVisibility } from '@/presentation/providers/mobile-application-context';
import { usePetScreenFocused } from '@/presentation/providers/pet-screen-visibility-context';

export interface PetVisualVisibilityInput {
  readonly appState: 'active' | 'background';
  readonly screenFocused: boolean;
  readonly mounted: boolean;
}

export const derivePetVisualVisibility = (
  input: PetVisualVisibilityInput,
): boolean =>
  input.appState === 'active' && input.screenFocused && input.mounted;

export const usePetVisualVisibility = (): boolean => {
  const appState = useAppVisibility();
  const screenFocused = usePetScreenFocused();
  return derivePetVisualVisibility({
    appState,
    screenFocused,
    mounted: true,
  });
};
