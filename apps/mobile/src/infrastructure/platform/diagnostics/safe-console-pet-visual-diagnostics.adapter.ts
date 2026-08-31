import type {
  PetVisualDiagnostic,
  PetVisualDiagnosticsPort,
} from '@/application';

export class SafeConsolePetVisualDiagnosticsAdapter
  implements PetVisualDiagnosticsPort
{
  record(diagnostic: PetVisualDiagnostic): void {
    console.info('[PixelDoro][PetVisual]', JSON.stringify(diagnostic));
  }
}
