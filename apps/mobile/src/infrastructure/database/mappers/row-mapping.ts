export const MAX_TIMESTAMP = 8_640_000_000_000_000;

export type RowMapping<TValue> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly field: string };

export const mapped = <TValue>(value: TValue): RowMapping<TValue> => ({
  ok: true,
  value: Object.freeze(value),
});

export const corrupt = <TValue = never>(field: string): RowMapping<TValue> => ({
  ok: false,
  field,
});

export const isSafeTimestamp = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value <= MAX_TIMESTAMP;

export const isNonNegativeSafeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export const isPositiveSafeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

export const isSQLiteBoolean = (value: unknown): value is 0 | 1 =>
  value === 0 || value === 1;

export const isNullableTimestamp = (
  value: unknown,
): value is number | null => value === null || isSafeTimestamp(value);

export const utf8ByteLength = (value: string): number => {
  let length = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    length +=
      codePoint <= 0x7f
        ? 1
        : codePoint <= 0x7ff
          ? 2
          : codePoint <= 0xffff
            ? 3
            : 4;
  }
  return length;
};
