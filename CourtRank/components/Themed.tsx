import React from 'react';
import { Text, TextInput, TextProps, TextInputProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Drop-in replacements for Text/TextInput that default to the active theme's
// text color. React Native otherwise renders unstyled text black in dark mode.
// Any color passed via `style` still wins.

export function ThemedText({ style, ...rest }: TextProps) {
  const { colors } = useTheme();
  return <Text style={[{ color: colors.text }, style]} {...rest} />;
}

export const ThemedTextInput = React.forwardRef<TextInput, TextInputProps>(
  ({ style, placeholderTextColor, ...rest }, ref) => {
    const { colors } = useTheme();
    return (
      <TextInput
        ref={ref}
        style={[{ color: colors.text }, style]}
        placeholderTextColor={placeholderTextColor ?? colors.textMuted}
        {...rest}
      />
    );
  }
);
ThemedTextInput.displayName = 'ThemedTextInput';
