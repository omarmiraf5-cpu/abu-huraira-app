import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { EventItem } from '@/src/api/muslimoon';
import { eventDateBadge, eventIcon } from '@/src/utils/events';
import { Card } from './Card';
import { Badge } from './Badge';
import { PressableScale } from './PressableScale';
import { GeometricPattern } from './GeometricPattern';
import { Icon, type IconName } from './Icon';
import { colors, elevation, gradients, radii, spacing, typography } from '@/src/theme/tokens';

type Variant = 'compact' | 'row' | 'featured';

type Props = {
  event: EventItem;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export function DateTile({ date, onGold = false, size = 56 }: { date: string; onGold?: boolean; size?: number }) {
  const badge = eventDateBadge(date);
  return (
    <View
      style={[
        styles.dateTile,
        { width: size, height: size },
        onGold ? styles.dateTileOnGold : null,
      ]}
    >
      <Text style={[styles.dateTop, onGold && { color: colors.textOnGoldMuted }]}>{badge.top}</Text>
      {badge.main ? (
        <Text style={[styles.dateMain, onGold && { color: colors.textOnGold }]}>{badge.main}</Text>
      ) : (
        <Icon name="calendar-clear-outline" size={18} color={onGold ? colors.textOnGold : colors.gold} />
      )}
    </View>
  );
}

function Meta({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.metaRow}>
      <Icon name={icon} size={14} color={colors.textTertiary} />
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function a11yLabel(e: EventItem) {
  return [e.title, e.date, e.time, e.location].filter(Boolean).join(', ');
}

export function EventCard({ event, variant = 'row', style, onPress }: Props) {
  const when = [event.date, event.time].filter(Boolean).join(' · ');

  if (variant === 'featured') return <FeaturedEvent event={event} style={style} onPress={onPress} />;

  if (variant === 'compact') {
    return (
      <Card style={[styles.compact, style]} padding={spacing.md} onPress={onPress} accessibilityLabel={a11yLabel(event)}>
        <View style={styles.compactTop}>
          <DateTile date={event.date} size={48} />
          <View style={styles.iconCircle}>
            <Icon name={eventIcon(event.title)} size={16} color={colors.textSecondary} />
          </View>
        </View>
        <Text style={styles.compactTitle} numberOfLines={1}>
          {event.title}
        </Text>
        {event.time ? <Meta icon="time-outline" text={[event.date, event.time].join(' · ')} /> : null}
        {event.location ? <Meta icon="location-outline" text={event.location} /> : null}
      </Card>
    );
  }

  return (
    <Card style={style} padding={spacing.md} onPress={onPress} accessibilityLabel={a11yLabel(event)}>
      <View style={styles.row}>
        <DateTile date={event.date} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{event.title}</Text>
          {when ? <Meta icon="time-outline" text={when} /> : null}
          {event.location ? <Meta icon="location-outline" text={event.location} /> : null}
          {event.instructor ? <Meta icon="person-outline" text={event.instructor} /> : null}
          {event.description ? (
            <Text style={styles.description} numberOfLines={3}>
              {event.description}
            </Text>
          ) : null}
          {event.fee || event.registration?.required || event.audience ? (
            <View style={styles.chips}>
              {event.fee ? <Badge label={event.fee} tone={/^free/i.test(event.fee) ? 'success' : 'gold'} /> : null}
              {event.registration?.closed ? (
                <Badge label="Registration closed" tone="neutral" />
              ) : event.registration?.required ? (
                <Badge label="Registration" tone="neutral" icon="create-outline" />
              ) : null}
            </View>
          ) : null}
        </View>
        {onPress ? <Icon name="chevron-forward" size={16} color={colors.textTertiary} style={styles.chevron} /> : null}
      </View>
    </Card>
  );
}

function FeaturedEvent({ event, style, onPress }: Omit<Props, 'variant'>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.width) > 1 || Math.abs(height - size.height) > 1) setSize({ width, height });
  };
  const Wrapper = onPress ? PressableScale : View;
  return (
    <Wrapper
      style={[styles.featured, style]}
      onLayout={onLayout}
      accessible
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Featured: ${a11yLabel(event)}`}
      {...(onPress ? { onPress, scaleTo: 0.985 } : {})}
    >
      <LinearGradient
        colors={gradients.plate}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.featuredRadius]}
      />
      {size.width > 0 ? (
        <View style={[StyleSheet.absoluteFill, styles.featuredRadius, { overflow: 'hidden' }]}>
          <GeometricPattern width={size.width} height={size.height} opacity={0.12} />
        </View>
      ) : null}
      <View style={styles.featuredInner}>
        <View style={styles.featuredTop}>
          <DateTile date={event.date} size={60} onGold />
          <View style={styles.featuredPill}>
            <Icon name={eventIcon(event.title)} size={14} color={colors.gold} />
            <Text style={styles.featuredPillText}>Featured</Text>
          </View>
        </View>
        <Text style={styles.featuredTitle}>{event.title}</Text>
        {event.description ? <Text style={styles.featuredDesc}>{event.description}</Text> : null}
        <View style={styles.featuredMeta}>
          {event.time ? <Meta icon="time-outline" text={[event.date, event.time].join(' · ')} /> : null}
          {event.location ? <Meta icon="location-outline" text={event.location} /> : null}
          {event.instructor ? <Meta icon="person-outline" text={event.instructor} /> : null}
        </View>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  dateTile: {
    borderRadius: radii.md,
    backgroundColor: colors.accentFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldHairline,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  dateTileOnGold: { backgroundColor: colors.gold, borderColor: colors.gold },
  dateTop: { ...typography.overline, fontSize: 9, lineHeight: 12, letterSpacing: 1, color: colors.nur },
  dateMain: { fontFamily: typography.numericLarge.fontFamily, fontSize: 17, lineHeight: 21, color: colors.gold, letterSpacing: 0.4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  metaText: { ...typography.footnote, color: colors.textSecondary, flexShrink: 1 },
  compact: { width: 232 },
  compactTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.ms },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.pearlTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitle: { ...typography.headline, color: colors.text },
  row: { flexDirection: 'row', gap: spacing.md },
  rowBody: { flex: 1 },
  rowTitle: { ...typography.headline, fontSize: 17, color: colors.text },
  description: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.ms },
  chevron: { alignSelf: 'center' },
  featured: {
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldHairline,
    ...elevation.md,
  },
  featuredRadius: { borderRadius: radii.xl },
  featuredInner: { padding: spacing.ml },
  featuredTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  featuredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.ms,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(5, 15, 25, 0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldHairline,
  },
  featuredPillText: { ...typography.caption, color: colors.gold },
  featuredTitle: { ...typography.title1, color: colors.text, marginTop: spacing.ml },
  featuredDesc: { ...typography.callout, color: colors.textSecondary, marginTop: spacing.xs },
  featuredMeta: { marginTop: spacing.sm },
});
