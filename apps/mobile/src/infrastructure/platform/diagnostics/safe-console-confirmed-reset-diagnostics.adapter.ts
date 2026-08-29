import type {
  ConfirmedResetDiagnostic,
  ConfirmedResetDiagnosticsPort,
} from '@/application';

export class SafeConsoleConfirmedResetDiagnosticsAdapter
  implements ConfirmedResetDiagnosticsPort
{
  record(diagnostic: ConfirmedResetDiagnostic): void {
    console.info('[PixelDoro][ConfirmedReset]', JSON.stringify(diagnostic));
  }
}
