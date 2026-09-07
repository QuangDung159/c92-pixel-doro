import { CountdownDisplay } from '@/presentation/components/countdown-display';

export const TrialCountdown = ({
  displaySeconds,
  pending,
}: {
  readonly displaySeconds: number;
  readonly pending: boolean;
}) => (
  <CountdownDisplay
    displaySeconds={displaySeconds}
    pending={pending}
    runningCaption="CỨ BẮT ĐẦU, RỒI NHỊP SẼ ĐẾN."
  />
);
