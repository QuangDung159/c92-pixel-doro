export type FocusMode = 'relax' | 'strict';
export type WorkTag = 'coding' | 'study' | 'writing' | 'reading';
export type FocusOutcome = 'completed' | 'failed' | 'cancelled';
export type BreakKind = 'short' | 'long';
export type BreakOutcome = 'completed' | 'cancelled';

export interface FocusConfiguration {
  readonly durationMinutes: number;
  readonly mode: FocusMode;
  readonly workTag: WorkTag;
}

export type PrototypeSession =
  | {
      readonly kind: 'trial';
      readonly durationMinutes: 5;
      readonly mode: 'relax';
    }
  | ({ readonly kind: 'focus' } & FocusConfiguration)
  | {
      readonly kind: 'break';
      readonly breakKind: BreakKind;
      readonly durationMinutes: 5 | 15;
    };

export interface PrototypeFocusResult {
  readonly kind: 'trial' | 'focus';
  readonly outcome: FocusOutcome;
  readonly durationMinutes: number;
  readonly mode: FocusMode;
  readonly workTag?: WorkTag;
  readonly xpEarned: number;
  readonly coinsEarned: number;
}

export interface PrototypeBreakResult {
  readonly breakKind: BreakKind;
  readonly durationMinutes: 5 | 15;
  readonly outcome: BreakOutcome;
}

export interface PrototypeState {
  readonly configuration: FocusConfiguration;
  readonly activeSession: PrototypeSession | null;
  readonly focusResult: PrototypeFocusResult | null;
  readonly breakResult: PrototypeBreakResult | null;
  readonly nextBreakKind: BreakKind;
}

export type PrototypeAction =
  | { readonly type: 'set-duration'; readonly durationMinutes: number }
  | { readonly type: 'set-mode'; readonly mode: FocusMode }
  | { readonly type: 'set-work-tag'; readonly workTag: WorkTag }
  | { readonly type: 'set-next-break-kind'; readonly breakKind: BreakKind }
  | { readonly type: 'start-trial' }
  | { readonly type: 'start-focus' }
  | { readonly type: 'resolve-focus'; readonly outcome: FocusOutcome }
  | { readonly type: 'start-break' }
  | { readonly type: 'resolve-break'; readonly outcome: BreakOutcome }
  | { readonly type: 'clear-session' };

export const initialPrototypeState: PrototypeState = {
  configuration: {
    durationMinutes: 25,
    mode: 'relax',
    workTag: 'coding',
  },
  activeSession: null,
  focusResult: null,
  breakResult: null,
  nextBreakKind: 'short',
};

const clampDuration = (durationMinutes: number): number =>
  Math.min(120, Math.max(15, Math.round(durationMinutes / 5) * 5));

const rewardFor = (durationMinutes: number, outcome: FocusOutcome) =>
  outcome === 'completed'
    ? {
        xpEarned: durationMinutes,
        coinsEarned: Math.floor(durationMinutes / 5),
      }
    : { xpEarned: 0, coinsEarned: 0 };

export const prototypeReducer = (
  state: PrototypeState,
  action: PrototypeAction,
): PrototypeState => {
  switch (action.type) {
    case 'set-duration':
      return {
        ...state,
        configuration: {
          ...state.configuration,
          durationMinutes: clampDuration(action.durationMinutes),
        },
      };
    case 'set-mode':
      return {
        ...state,
        configuration: { ...state.configuration, mode: action.mode },
      };
    case 'set-work-tag':
      return {
        ...state,
        configuration: { ...state.configuration, workTag: action.workTag },
      };
    case 'set-next-break-kind':
      return { ...state, nextBreakKind: action.breakKind };
    case 'start-trial':
      return {
        ...state,
        activeSession: { kind: 'trial', durationMinutes: 5, mode: 'relax' },
        focusResult: null,
      };
    case 'start-focus':
      return {
        ...state,
        activeSession: { kind: 'focus', ...state.configuration },
        focusResult: null,
      };
    case 'resolve-focus': {
      const session = state.activeSession;
      if (session === null || session.kind === 'break') return state;
      if (action.outcome === 'failed' && session.mode !== 'strict') return state;

      return {
        ...state,
        activeSession: null,
        focusResult: {
          kind: session.kind,
          outcome: action.outcome,
          durationMinutes: session.durationMinutes,
          mode: session.mode,
          ...(session.kind === 'focus' ? { workTag: session.workTag } : {}),
          ...rewardFor(session.durationMinutes, action.outcome),
        },
      };
    }
    case 'start-break': {
      const durationMinutes = state.nextBreakKind === 'long' ? 15 : 5;
      return {
        ...state,
        activeSession: {
          kind: 'break',
          breakKind: state.nextBreakKind,
          durationMinutes,
        },
        breakResult: null,
      };
    }
    case 'resolve-break': {
      const session = state.activeSession;
      if (session === null || session.kind !== 'break') return state;
      return {
        ...state,
        activeSession: null,
        breakResult: {
          breakKind: session.breakKind,
          durationMinutes: session.durationMinutes,
          outcome: action.outcome,
        },
      };
    }
    case 'clear-session':
      return { ...state, activeSession: null };
  }
};
