export interface ApplicationWarning {
  readonly code: string;
}

export type ApplicationResult<TValue, TError> =
  | {
      readonly ok: true;
      readonly value: TValue;
      readonly warnings?: readonly ApplicationWarning[];
    }
  | {
      readonly ok: false;
      readonly error: TError;
    };

