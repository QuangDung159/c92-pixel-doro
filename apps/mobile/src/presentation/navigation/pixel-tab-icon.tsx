import { StyleSheet, View, type ColorValue } from "react-native";

export type PixelTabIconName = "history" | "pet-room" | "settings" | "shop";

const PIXEL_SIZE = 2;

const iconPatterns: Record<PixelTabIconName, readonly string[]> = {
  "pet-room": [
    "000010000",
    "000111000",
    "001111100",
    "011111110",
    "111111111",
    "110101011",
    "111111111",
    "111000111",
    "111000111",
  ],
  history: [
    "001111100",
    "011000110",
    "110000011",
    "110010011",
    "110011111",
    "110000011",
    "011000110",
    "001111100",
    "000000000",
  ],
  shop: [
    "000111000",
    "001000100",
    "001000100",
    "011111110",
    "111111111",
    "110101011",
    "110101011",
    "111111111",
    "011111110",
  ],
  settings: [
    "001010100",
    "011111110",
    "011111110",
    "111000111",
    "110000011",
    "111000111",
    "011111110",
    "011111110",
    "001010100",
  ],
};

interface PixelTabIconProps {
  readonly color: ColorValue;
  readonly name: PixelTabIconName;
}

export const PixelTabIcon = ({ color, name }: PixelTabIconProps) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={styles.canvas}
    testID={`tab-icon-${name}`}
  >
    {iconPatterns[name].flatMap((row, rowIndex) =>
      [...row].map((cell, columnIndex) =>
        cell === "1" ? (
          <View
            key={`${rowIndex}-${columnIndex}`}
            style={[
              styles.pixel,
              {
                backgroundColor: color,
                left: columnIndex * PIXEL_SIZE,
                top: rowIndex * PIXEL_SIZE,
              },
            ]}
          />
        ) : null,
      ),
    )}
  </View>
);

const styles = StyleSheet.create({
  canvas: {
    height: PIXEL_SIZE * 9,
    width: PIXEL_SIZE * 9,
  },
  pixel: {
    height: PIXEL_SIZE,
    position: "absolute",
    width: PIXEL_SIZE,
  },
});
