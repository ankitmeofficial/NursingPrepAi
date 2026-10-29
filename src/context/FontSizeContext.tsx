import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type FontSizeLevel = 'small' | 'medium' | 'large' | 'xlarge';

export interface FontSizeConfig {
  level: FontSizeLevel;
  label: string;
  scale: number;
  offset: number;
}

export const FONT_SIZE_CONFIGS: Record<FontSizeLevel, FontSizeConfig> = {
  small: { level: 'small', label: 'Small', scale: 0.88, offset: -2 },
  medium: { level: 'medium', label: 'Medium', scale: 1.0, offset: 0 },
  large: { level: 'large', label: 'Large', scale: 1.16, offset: 2 },
  xlarge: { level: 'xlarge', label: 'Extra Large', scale: 1.32, offset: 4 },
};

export const ORDERED_FONT_LEVELS: FontSizeLevel[] = ['small', 'medium', 'large', 'xlarge'];

const FONT_SIZE_STORAGE_KEY = '@nursing_prep_font_size';

interface FontSizeContextType {
  fontSizeLevel: FontSizeLevel;
  fontSizeScale: number;
  fontSizeOffset: number;
  setFontSizeLevel: (level: FontSizeLevel) => Promise<void>;
  increaseFontSize: () => Promise<void>;
  decreaseFontSize: () => Promise<void>;
  canIncrease: boolean;
  canDecrease: boolean;
  scaleFont: (baseSize: number) => number;
}

const FontSizeContext = createContext<FontSizeContextType>({
  fontSizeLevel: 'medium',
  fontSizeScale: 1.0,
  fontSizeOffset: 0,
  setFontSizeLevel: async () => {},
  increaseFontSize: async () => {},
  decreaseFontSize: async () => {},
  canIncrease: true,
  canDecrease: true,
  scaleFont: (size) => size,
});

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSizeLevel, setFontSizeLevelState] = useState<FontSizeLevel>('medium');

  useEffect(() => {
    AsyncStorage.getItem(FONT_SIZE_STORAGE_KEY)
      .then((saved) => {
        if (
          saved === 'small' ||
          saved === 'medium' ||
          saved === 'large' ||
          saved === 'xlarge'
        ) {
          setFontSizeLevelState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setFontSizeLevel = async (level: FontSizeLevel) => {
    setFontSizeLevelState(level);
    try {
      await AsyncStorage.setItem(FONT_SIZE_STORAGE_KEY, level);
    } catch {}
  };

  const currentIndex = ORDERED_FONT_LEVELS.indexOf(fontSizeLevel);
  const canDecrease = currentIndex > 0;
  const canIncrease = currentIndex < ORDERED_FONT_LEVELS.length - 1;

  const increaseFontSize = async () => {
    if (canIncrease) {
      const nextLevel = ORDERED_FONT_LEVELS[currentIndex + 1];
      await setFontSizeLevel(nextLevel);
    }
  };

  const decreaseFontSize = async () => {
    if (canDecrease) {
      const prevLevel = ORDERED_FONT_LEVELS[currentIndex - 1];
      await setFontSizeLevel(prevLevel);
    }
  };

  const currentConfig = FONT_SIZE_CONFIGS[fontSizeLevel];
  const fontSizeScale = currentConfig.scale;
  const fontSizeOffset = currentConfig.offset;

  const scaleFont = (baseSize: number): number => {
    return Math.round(baseSize * fontSizeScale);
  };

  return (
    <FontSizeContext.Provider
      value={{
        fontSizeLevel,
        fontSizeScale,
        fontSizeOffset,
        setFontSizeLevel,
        increaseFontSize,
        decreaseFontSize,
        canIncrease,
        canDecrease,
        scaleFont,
      }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  return useContext(FontSizeContext);
}
