import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useReducer,
} from 'react';

import {
  type BreakKind,
  type BreakOutcome,
  type FocusMode,
  type FocusOutcome,
  initialPrototypeState,
  prototypeReducer,
  type PrototypeState,
  type WorkTag,
} from './prototype-state';

interface PrototypeContextValue extends PrototypeState {
  readonly setDuration: (durationMinutes: number) => void;
  readonly setMode: (mode: FocusMode) => void;
  readonly setWorkTag: (workTag: WorkTag) => void;
  readonly setNextBreakKind: (breakKind: BreakKind) => void;
  readonly startTrial: () => void;
  readonly startFocus: () => void;
  readonly resolveFocus: (outcome: FocusOutcome) => void;
  readonly startBreak: () => void;
  readonly resolveBreak: (outcome: BreakOutcome) => void;
  readonly clearSession: () => void;
}

const PrototypeContext = createContext<PrototypeContextValue | undefined>(undefined);

export const PrototypeProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(prototypeReducer, initialPrototypeState);

  const value = useMemo<PrototypeContextValue>(
    () => ({
      ...state,
      setDuration: (durationMinutes) =>
        dispatch({ type: 'set-duration', durationMinutes }),
      setMode: (mode) => dispatch({ type: 'set-mode', mode }),
      setWorkTag: (workTag) => dispatch({ type: 'set-work-tag', workTag }),
      setNextBreakKind: (breakKind) =>
        dispatch({ type: 'set-next-break-kind', breakKind }),
      startTrial: () => dispatch({ type: 'start-trial' }),
      startFocus: () => dispatch({ type: 'start-focus' }),
      resolveFocus: (outcome) => dispatch({ type: 'resolve-focus', outcome }),
      startBreak: () => dispatch({ type: 'start-break' }),
      resolveBreak: (outcome) => dispatch({ type: 'resolve-break', outcome }),
      clearSession: () => dispatch({ type: 'clear-session' }),
    }),
    [state],
  );

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
};

export const usePrototype = (): PrototypeContextValue => {
  const value = useContext(PrototypeContext);
  if (value === undefined) {
    throw new Error('PrototypeProvider is missing');
  }
  return value;
};
