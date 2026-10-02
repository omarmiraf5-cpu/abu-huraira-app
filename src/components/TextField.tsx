import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

type Props = TextInputProps & {
  label?: string;
  icon?: IconName;
  prefix?: string;
  suffix?: string;
};

/** Sunken input with a gold focus ring. */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, icon, prefix, suffix, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, focused && styles.focused]}>
        {icon ? <Icon name={icon} size={18} color={focused ? colors.gold : colors.textTertiary} /> : null}
        {prefix ? <Text style={styles.affix}>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.gold}
          cursorColor={colors.gold}
          accessibilityLabel={label ?? rest.placeholder}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, style]}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  label: { ...typography.footnote, fontFamily: typography.headline.fontFamily, color: colors.textSecondary, marginBottom: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  focused: { borderColor: colors.gold, backgroundColor: 'rgba(5, 15, 25, 0.6)' },
  affix: { ...typography.body, fontFamily: typography.headline.fontFamily, color: colors.textSecondary },
  suffix: { ...typography.caption, color: colors.textTertiary, letterSpacing: 0.6, flexShrink: 0 },
  input: {
    flex: 1,
    minWidth: 0,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.ms,
    // Remove the default web focus outline; the field shows its own ring.
    outlineStyle: 'none',
  } as object,
});
