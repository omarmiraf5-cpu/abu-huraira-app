import { Linking, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import Svg, { Path } from 'react-native-svg';
import { eightPointStar } from '@/src/components/geometry';
import { Screen } from '@/src/components/Screen';
import { HeroHeader } from '@/src/components/HeroHeader';
import { Card } from '@/src/components/Card';
import { BrandLogo } from '@/src/components/BrandLogo';
import { SectionHeader } from '@/src/components/SectionHeader';
import { ListGroup, ListRow } from '@/src/components/ListGroup';
import { JewelIcon } from '@/src/components/icons/JewelIcon';
import { useNotificationPrefs } from '@/src/notifications/prefs';
import { brand, colors, spacing, typography } from '@/src/theme/tokens';

export default function MoreScreen() {
  const { prefs } = useNotificationPrefs();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <Screen
      header={
        <HeroHeader>
          <View style={styles.heroCenter}>
            <View style={styles.medallion}>
              <Svg width={168} height={168} style={StyleSheet.absoluteFill}>
                <Path d={eightPointStar(84, 84, 83)} fill={colors.accentFill} stroke={colors.gold} strokeOpacity={0.45} strokeWidth={1} />
                <Path d={eightPointStar(84, 84, 66)} fill="none" stroke={colors.gold} strokeOpacity={0.18} strokeWidth={1} />
              </Svg>
              <BrandLogo height={88} />
            </View>
            <Text style={styles.name} accessibilityRole="header">
              {brand.name}
            </Text>
            <Text style={styles.tagline}>{brand.tagline}</Text>
          </View>
        </HeroHeader>
      }
    >
      <Card>
        <View style={styles.aboutHead}>
          <JewelIcon name="mosque" tone="gold" size="sm" />
          <Text style={styles.aboutTitle}>About AHC</Text>
        </View>
        <Text style={styles.body}>
          {brand.name} ({brand.shortName}) is a house of worship, learning, and
          community serving Muslim families and neighbors. This mobile app
          brings prayer times, events, and donations into one place.
        </Text>
      </Card>

      <SectionHeader title="Contact" />
      <ListGroup>
        <ListRow
          icon="globe" tone="emerald"
          title="Website"
          subtitle="abuhuraira.org"
          trailingIcon="open-outline"
          chevron={false}
          onPress={() => Linking.openURL(brand.website)}
          accessibilityHint="Opens the website"
        />
        <ListRow
          icon="mail" tone="sapphire"
          title="Email us"
          subtitle={brand.email}
          onPress={() => Linking.openURL(`mailto:${brand.email}`)}
          accessibilityHint="Opens your email app"
        />
        <ListRow icon="pin" tone="rose" title="Address" subtitle="To be confirmed" />
        <ListRow icon="phone" tone="teal" title="Phone" subtitle="To be confirmed" />
      </ListGroup>
      <Text style={styles.note}>
        Address and phone are placeholders until verified contact details are
        confirmed from the brand book / MasjidOps.
      </Text>

      <SectionHeader title="Explore" />
      <ListGroup>
        <ListRow icon="mosque" tone="sapphire" title="Prayer times" onPress={() => router.push('/(tabs)/prayer')} />
        <ListRow icon="calendar" tone="violet" title="Events" onPress={() => router.push('/(tabs)/events')} />
        <ListRow icon="give" tone="rose" title="Donate" onPress={() => router.push('/(tabs)/donate')} />
      </ListGroup>

      <SectionHeader title="App" />
      <ListGroup>
        <ListRow
          icon="bell"
          tone="gold"
          title="Notifications"
          value={prefs.prayer.enabled || prefs.events.enabled ? 'On' : 'Off'}
          onPress={() => router.push('/notifications')}
          accessibilityHint="Salah, class and event reminders"
        />
        <ListRow icon="cloud" tone="teal" title="Prayer data" value="Muslimoon" />
        <ListRow icon="clock" tone="gold" title="Timezone" value="Toronto" />
        <ListRow icon="info" tone="slate" title="Version" value={version} />
      </ListGroup>

      <View style={styles.footer}>
        <View style={styles.footerRule} />
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} {brand.name}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCenter: { alignItems: 'center', paddingTop: spacing.md },
  medallion: { width: 168, height: 168, alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.title1, color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  tagline: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  aboutHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, marginBottom: spacing.ms },
  aboutTitle: { ...typography.headline, color: colors.text },
  body: { ...typography.callout, color: colors.textSecondary },
  note: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.sm, paddingHorizontal: spacing.xs },
  footer: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.ms },
  footerRule: { width: 40, height: 2, borderRadius: 1, backgroundColor: colors.goldHairline },
  footerText: { ...typography.caption, color: colors.textTertiary },
});
