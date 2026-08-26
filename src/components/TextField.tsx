import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/constants/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, style, secureTextEntry, ...inputProps }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const isPassword = secureTextEntry !== undefined;

    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={ref}
            style={[
              styles.input,
              isPassword ? styles.inputWithIcon : null,
              error ? styles.inputError : null,
              style,
            ]}
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={isPassword ? !isVisible : undefined}
            {...inputProps}
          />
          {isPassword ? (
            <Pressable
              style={styles.toggle}
              onPress={() => setIsVisible((value) => !value)}
              hitSlop={8}
            >
              <Ionicons
                name={isVisible ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textTertiary}
              />
            </Pressable>
          ) : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }
);

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontFamily: typography.fontBody,
    fontSize: 16,
  },
  inputWithIcon: {
    paddingRight: spacing.xxl,
  },
  inputError: {
    borderColor: colors.danger,
  },
  toggle: {
    position: 'absolute',
    right: spacing.lg,
    padding: spacing.xs,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.fontBody,
    fontSize: 13,
    marginTop: spacing.xs,
  },
});
