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
import { useStaticDetails } from '@/src/hooks/useStaticDetails';
import * as WebBrowser from 'expo-web-browser';
import { brand, colors, spacing, typography } from '@/src/theme/tokens';

export default function MoreScreen() {
  const { prefs } = useNotificationPrefs();
  const details = useStaticDetails();
  const openWeb = (url: string) =>
    WebBrowser.openBrowserAsync(url, { controlsColor: colors.gold, toolbarColor: colors.navy, dismissButtonStyle: 'done' });
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
          community serving Muslim families and neighbors across the GTA since
          2001. This mobile app brings prayer times, events, and donations into
          one place.
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
          subtitle={details.email}
          onPress={() => Linking.openURL(`mailto:${details.email}`)}
          accessibilityHint="Opens your email app"
        />
        <ListRow
          icon="pin" tone="rose"
          title="Address"
          subtitle={details.address}
          trailingIcon="open-outline"
          chevron={false}
          onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.address)}`)}
          accessibilityHint="Opens maps"
        />
        <ListRow
          icon="phone" tone="teal"
          title="Call"
          subtitle={details.phone}
          onPress={() => Linking.openURL(`tel:${details.phone.replace(/[^\d+]/g, '')}`)}
          accessibilityHint="Calls the masjid"
        />
      </ListGroup>
      <Text style={styles.note}>
        Contact details from abuhuraira.org. They’ll follow Muslimoon once AHC
        fills in Settings › Static Details.
      </Text>

      <SectionHeader title="Watch & follow" />
      <ListGroup>
        <ListRow
          icon="logo-youtube" tone="rose"
          title="Watch live"
          subtitle="Khutbahs and classes on YouTube"
          trailingIcon="open-outline"
          chevron={false}
          onPress={() => openWeb(details.youtubeLiveUrl)}
          accessibilityHint="Opens AHC’s YouTube live stream"
        />
        <ListRow
          icon="play-circle" tone="slate"
          title="YouTube channel"
          subtitle={brand.youtube.handle}
          onPress={() => openWeb(details.youtubeChannelUrl)}
          accessibilityHint="Opens AHC’s YouTube channel"
        />
        <ListRow
          icon="logo-instagram" tone="violet"
          title="Instagram"
          subtitle="@abuhurairacenter"
          onPress={() => openWeb(brand.socials.instagram)}
          accessibilityHint="Opens AHC’s Instagram"
        />
        <ListRow
          icon="logo-facebook" tone="sapphire"
          title="Facebook"
          subtitle="Abu Huraira Center"
          onPress={() => openWeb(brand.socials.facebook)}
          accessibilityHint="Opens AHC’s Facebook page"
        />
      </ListGroup>

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
