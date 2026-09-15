import type { OtaUpdateProjection } from '@/application';

export const otaPromptOwnsModal = (projection: OtaUpdateProjection): boolean =>
  projection.status === 'restarting' ||
  (projection.status === 'pending' && projection.prompt === 'visible');
