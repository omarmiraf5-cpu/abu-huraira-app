import { StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { PressableScale } from './PressableScale';
import { JewelIcon } from './icons/JewelIcon';
import { useStaticDetails } from '@/src/hooks/useStaticDetails';
import { FONT_CAP } from '@/src/hooks/useResponsive';
import { brand, colors, radii, spacing, typography } from '@/src/theme/tokens';

/** "Watch live" — opens AHC's YouTube live page (CMS value when set, else the website handle). */
export function WatchLiveCard() {
  const details = useStaticDetails();
  return (
    <PressableScale
      onPress={() =>
        WebBrowser.openBrowserAsync(details.youtubeLiveUrl, { controlsColor: colors.gold, toolbarColor: colors.navy, dismissButtonStyle: 'done' })
      }
      style={styles.card}
      accessibilityRole="link"
      accessibilityLabel="Watch live on YouTube"
      accessibilityHint="Opens AHC’s YouTube live stream"
    >
      <JewelIcon name="logo-youtube" tone="rose" size="md" />
      <View style={styles.text}>
        <Text style={styles.title} maxFontSizeMultiplier={FONT_CAP.body}>
          Watch live
        </Text>
        <Text style={styles.body} maxFontSizeMultiplier={FONT_CAP.body} numberOfLines={2}>
          Khutbahs, classes and halaqahs on {brand.youtube.handle}
        </Text>
      </View>
      <View style={styles.pill}>
        <View style={styles.liveDot} />
        <Text style={styles.pillText} maxFontSizeMultiplier={FONT_CAP.dense}>
          Watch
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderTopColor: colors.hairlineStrong,
  },
  text: { flex: 1, minWidth: 0 },
  title: { ...typography.headline, color: colors.text },
  body: { ...typography.footnote, color: colors.textSecondary, marginTop: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#f43f5e' },
  pillText: { ...typography.caption, fontFamily: typography.headline.fontFamily, color: colors.text },
});
