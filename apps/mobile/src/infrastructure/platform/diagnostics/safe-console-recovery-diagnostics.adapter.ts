import type {
  RecoveryDiagnostic,
  RecoveryDiagnosticsPort,
} from '@/application';

export class SafeConsoleRecoveryDiagnosticsAdapter
  implements RecoveryDiagnosticsPort
{
  record(diagnostic: RecoveryDiagnostic): void {
    console.info('[PixelDoro][Recovery]', JSON.stringify(diagnostic));
  }
}
