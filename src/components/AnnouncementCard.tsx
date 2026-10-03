import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { Announcement } from '@/src/api/muslimoon';
import { Card } from './Card';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { JewelIcon } from './icons/JewelIcon';
import { FONT_CAP } from '@/src/hooks/useResponsive';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

/** A Muslimoon announcement-bar item (or its website-based preview). */
export function AnnouncementCard({ item, style }: { item: Announcement; style?: StyleProp<ViewStyle> }) {
  const open = () =>
    item.linkUrl
      ? WebBrowser.openBrowserAsync(item.linkUrl, { controlsColor: colors.gold, toolbarColor: colors.navy, dismissButtonStyle: 'done' })
      : undefined;
  return (
    <Card padding={spacing.md} style={style}>
      <View style={styles.row}>
        <JewelIcon name="megaphone" tone="gold" size="sm" glow={false} />
        <View style={styles.body}>
          {item.category ? <Text style={styles.eyebrow}>{item.category}</Text> : null}
          {item.title ? (
            <Text style={styles.title} maxFontSizeMultiplier={FONT_CAP.body}>
              {item.title}
            </Text>
          ) : null}
          <Text style={[styles.message, !item.title && styles.messageOnly]} maxFontSizeMultiplier={FONT_CAP.body}>
            {item.message}
          </Text>
          {item.linkUrl ? (
            <PressableScale onPress={open} style={styles.link} accessibilityRole="link" accessibilityLabel={item.linkText ?? 'Learn more'}>
              <Text style={styles.linkText} maxFontSizeMultiplier={FONT_CAP.dense}>
                {item.linkText ?? 'Learn more'}
              </Text>
              <Icon name="arrow-forward" size={14} color={colors.gold} />
            </PressableScale>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.ms, alignItems: 'flex-start' },
  body: { flex: 1, minWidth: 0 },
  eyebrow: { ...typography.overline, color: colors.nur, marginBottom: 2 },
  title: { ...typography.headline, color: colors.text },
  message: { ...typography.subhead, color: colors.textSecondary, marginTop: 2 },
  messageOnly: { ...typography.callout, color: colors.text, marginTop: 6 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.ms,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.goldHairline,
    backgroundColor: colors.accentFill,
  },
  linkText: { ...typography.caption, fontFamily: typography.headline.fontFamily, color: colors.gold },
});
