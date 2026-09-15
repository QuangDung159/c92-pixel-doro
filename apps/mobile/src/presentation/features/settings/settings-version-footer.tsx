import { StyleSheet, Text } from "react-native";

import type { OtaReleaseInfo } from "@/application";
import { palette } from "@/presentation/theme/palette";

export const SettingsVersionFooter = ({
  release,
}: {
  readonly release: OtaReleaseInfo;
}) => (
  <Text selectable style={styles.footer}>
    {`Version ${release.appVersion ?? "không xác định"} · OTA ${release.otaNumber ?? "embedded"}`}
  </Text>
);

const styles = StyleSheet.create({
  footer: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
