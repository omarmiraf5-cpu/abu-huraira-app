import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FormField, FormSchema } from '@/src/api/muslimoon';
import { Button } from '../Button';
import { Icon, type IconName } from '../Icon';
import { PressableScale, triggerHaptic } from '../PressableScale';
import { TextField } from '../TextField';
import { FONT_CAP } from '@/src/hooks/useResponsive';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

export type FormValues = Record<string, string | boolean | string[]>;

type Props = {
  schema: FormSchema;
  /** When false the submit button is disabled with `disabledLabel` (default while submission isn't wired). */
  submitEnabled?: boolean;
  disabledLabel?: string;
  onSubmit?: (values: FormValues) => void | Promise<void>;
};

const KEYBOARD: Partial<Record<FormField['type'], { icon: IconName; keyboardType?: 'email-address' | 'phone-pad' | 'number-pad'; autoComplete?: 'email' | 'tel' | 'name' }>> = {
  email: { icon: 'mail-outline', keyboardType: 'email-address', autoComplete: 'email' },
  phone: { icon: 'call-outline', keyboardType: 'phone-pad', autoComplete: 'tel' },
  number: { icon: 'keypad-outline', keyboardType: 'number-pad' },
  date: { icon: 'calendar-outline' },
};

function initial(fields: FormField[]): FormValues {
  const v: FormValues = {};
  for (const f of fields) v[f.id] = f.type === 'checkbox' ? false : f.type === 'multiselect' ? [] : '';
  return v;
}

function validate(fields: FormField[], values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = values[f.id];
    const empty = v === '' || v === false || (Array.isArray(v) && v.length === 0) || v === undefined;
    if (f.required && empty) errors[f.id] = f.type === 'checkbox' ? 'Please confirm to continue.' : 'Required';
    else if (!empty && f.type === 'email' && typeof v === 'string' && !/^\S+@\S+\.\S+$/.test(v)) errors[f.id] = 'Enter a valid email';
    else if (!empty && f.type === 'number' && typeof v === 'string' && !/^\d+(\.\d+)?$/.test(v.trim())) errors[f.id] = 'Numbers only';
  }
  return errors;
}

/**
 * Renders a Muslimoon public form (GET /api/public/<org>/forms/<id>, normalised
 * by normalizeFormSchema) in the app's premium style. Field types it doesn't
 * know fall back to a text input, so a new CMS field type can't crash it.
 */
export function FormRenderer({ schema, submitEnabled = false, disabledLabel = 'In-app registration coming soon', onSubmit }: Props) {
  const [values, setValues] = useState<FormValues>(() => initial(schema.fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (id: string, v: string | boolean | string[]) => {
    setValues((prev) => ({ ...prev, [id]: v }));
    if (errors[id]) setErrors(({ [id]: _drop, ...rest }) => rest);
  };

  const submit = async () => {
    const e = validate(schema.fields, values);
    setErrors(e);
    if (Object.keys(e).length || !onSubmit) return;
    setBusy(true);
    try {
      await onSubmit(values);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      {schema.title ? <Text style={styles.title}>{schema.title}</Text> : null}
      {schema.description ? <Text style={styles.description}>{schema.description}</Text> : null}
      <View style={styles.fields}>
        {schema.fields.map((f) => (
          <Field key={f.id} field={f} value={values[f.id]} error={errors[f.id]} onChange={(v) => set(f.id, v)} />
        ))}
      </View>
      <Button
        label={submitEnabled ? schema.submitLabel ?? 'Submit' : disabledLabel}
        icon={submitEnabled ? 'paper-plane-outline' : 'time-outline'}
        variant={submitEnabled ? 'primary' : 'secondary'}
        onPress={submit}
        disabled={!submitEnabled}
        loading={busy}
        style={styles.submit}
      />
    </View>
  );
}

function Label({ field }: { field: FormField }) {
  return (
    <Text style={styles.label} maxFontSizeMultiplier={FONT_CAP.body}>
      {field.label}
      {field.required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

function Field({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: FormValues[string] | undefined;
  error?: string;
  onChange: (v: string | boolean | string[]) => void;
}) {
  const help = error ? (
    <Text style={styles.error} accessibilityRole="alert">
      {error}
    </Text>
  ) : field.helpText ? (
    <Text style={styles.help}>{field.helpText}</Text>
  ) : null;

  if (field.type === 'info') return <Text style={styles.info}>{field.label}</Text>;

  if (field.type === 'select' || field.type === 'radio' || field.type === 'multiselect') {
    const multi = field.type === 'multiselect';
    const selected = multi ? (Array.isArray(value) ? value : []) : [typeof value === 'string' ? value : ''];
    return (
      <View>
        <Label field={field} />
        <View style={styles.chips} accessibilityRole={multi ? undefined : 'radiogroup'} accessibilityLabel={field.label}>
          {field.options.map((o) => {
            const on = selected.includes(o.value);
            return (
              <PressableScale
                key={o.value}
                onPress={() => onChange(multi ? (on ? selected.filter((x) => x !== o.value) : [...selected, o.value]) : o.value)}
                accessibilityRole={multi ? 'checkbox' : 'radio'}
                accessibilityState={{ selected: on, checked: on }}
                accessibilityLabel={o.label}
                style={[styles.chip, on && styles.chipOn]}
              >
                {on ? <Icon name="checkmark" size={14} color={colors.textOnGold} /> : null}
                <Text style={[styles.chipText, on && styles.chipTextOn]} maxFontSizeMultiplier={FONT_CAP.dense}>
                  {o.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>
        {help}
      </View>
    );
  }

  if (field.type === 'checkbox') {
    const on = value === true;
    return (
      <View>
        <Pressable
          onPress={() => {
            triggerHaptic();
            onChange(!on);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: on }}
          accessibilityLabel={field.label}
          style={styles.checkRow}
        >
          <View style={[styles.checkBox, on && styles.checkBoxOn, !!error && styles.checkBoxError]}>
            {on ? <Icon name="checkmark" size={15} color={colors.textOnGold} /> : null}
          </View>
          <Text style={styles.checkLabel}>
            {field.label}
            {field.required ? <Text style={styles.required}> *</Text> : null}
          </Text>
        </Pressable>
        {help}
      </View>
    );
  }

  const kb = KEYBOARD[field.type];
  return (
    <View>
      <Label field={field} />
      <TextField
        icon={kb?.icon}
        placeholder={field.placeholder ?? (field.type === 'date' ? 'YYYY-MM-DD' : undefined)}
        value={typeof value === 'string' ? value : ''}
        onChangeText={onChange}
        keyboardType={kb?.keyboardType}
        autoComplete={kb?.autoComplete}
        autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
        multiline={field.type === 'textarea'}
        numberOfLines={field.type === 'textarea' ? 4 : undefined}
        style={field.type === 'textarea' ? styles.textarea : undefined}
        accessibilityLabel={field.label}
      />
      {help}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title3, color: colors.text },
  description: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.xs },
  fields: { gap: spacing.ml, marginTop: spacing.ml },
  label: { ...typography.footnote, fontFamily: typography.headline.fontFamily, color: colors.textSecondary, marginBottom: spacing.sm },
  required: { color: colors.gold },
  help: { ...typography.caption, color: colors.textTertiary, marginTop: 6 },
  error: { ...typography.caption, color: colors.danger, marginTop: 6 },
  info: { ...typography.subhead, color: colors.textSecondary },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surfaceSunken,
  },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { ...typography.subhead, color: colors.text },
  chipTextOn: { color: colors.textOnGold, fontFamily: typography.headline.fontFamily },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, minHeight: 44 },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  checkBoxError: { borderColor: colors.danger },
  checkLabel: { ...typography.subhead, color: colors.text, flex: 1 },
  submit: { marginTop: spacing.lg },
});
