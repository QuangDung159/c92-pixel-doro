# ADR-003: State and persistence ownership

- **Status:** `ACCEPTED`
- **Date:** 2026-08-26
- **Owners:** Engineering/Tech Lead

## Context

PixelDoro cần state phản hồi nhanh cho UI nhưng session, reward và inventory phải sống qua crash/relaunch. Nếu cùng một dữ liệu bền vững được coi là nguồn sự thật ở cả store và database, reconciliation và reward idempotency dễ sai.

## Decision

Dùng Zustand cho client/UI state và SQLite qua `expo-sqlite` cho durable state. SQLite là nguồn sự thật cho session, reward ledger, Pet/progression, inventory và settings. Zustand chỉ giữ projection có thể hydrate/dựng lại.

Mọi database access đi qua repository. Screen và route không query SQLite trực tiếp.

## Consequences

- App startup cần hydration/reconciliation rõ ràng.
- Store có thể reset mà không làm mất durable product state.
- Terminal session transition và reward ledger cần database transaction/unique constraint để idempotent.
- Data Model phải định nghĩa schema version và migration.

## Alternatives considered

- Chỉ dùng persisted Zustand: đơn giản ban đầu nhưng không phù hợp transaction, history query, migration và reward ledger.
- Dùng remote database: mâu thuẫn offline-first/no-account của MVP.

## References

- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Zustand documentation](https://zustand.docs.pmnd.rs/)
