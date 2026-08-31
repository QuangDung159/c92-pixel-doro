export interface TestSharedValue<TValue> {
  value: TValue;
  set(value: TValue): void;
}

export const useSharedValue = <TValue,>(initialValue: TValue): TestSharedValue<TValue> => ({
  value: initialValue,
  set(value) {
    this.value = value;
  },
});

export const useAnimatedStyle = <TValue,>(updater: () => TValue): TValue =>
  updater();

export const useReducedMotion = (): boolean => false;

export const cancelAnimation = (): void => undefined;

export const interpolate = (
  value: number,
  input: readonly [number, number],
  output: readonly [number, number],
): number => {
  const ratio = (value - input[0]) / (input[1] - input[0]);
  return output[0] + ratio * (output[1] - output[0]);
};

export const withTiming = (
  value: number,
  _configuration?: unknown,
  callback?: (finished: boolean) => void,
): number => {
  callback?.(true);
  return value;
};

export const withRepeat = (value: number): number => value;
export const withSequence = (...values: number[]): number => values.at(-1) ?? 0;
export const runOnJS = <TFunction extends (...args: never[]) => unknown>(
  callback: TFunction,
): TFunction => callback;

export const Easing = {
  quad: (value: number): number => value * value,
  inOut: <TFunction extends (value: number) => number>(callback: TFunction): TFunction =>
    callback,
};

const Animated = { View: 'AnimatedView' };

export default Animated;
