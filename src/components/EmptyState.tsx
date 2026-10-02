import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { StarMedallion } from './StarMedallion';
import type { IconName } from './Icon';
import { colors, spacing, typography } from '@/src/theme/tokens';

type Props = {
  icon: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Calm, centred empty state inside a plate. */
export function EmptyState({ icon, title, body, actionLabel, onAction }: Props) {
  return (
    <Card padding={spacing.xl}>
      <View style={styles.center}>
        <StarMedallion icon={icon} size={84} />
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
        {actionLabel && onAction ? (
          <Button
            label={actionLabel}
            onPress={onAction}
            variant="outline"
            size="md"
            fullWidth={false}
            style={styles.action}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  title: { ...typography.title3, color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  body: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    maxWidth: 300,
  },
  action: { marginTop: spacing.ml, alignSelf: 'center' },
});
