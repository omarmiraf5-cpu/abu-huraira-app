import React from 'react';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Glyph } from '@/src/components/icons/Glyph';
import type { GlyphName } from '@/src/components/icons/glyphs';
import { triggerHaptic } from '@/src/components/PressableScale';
import { ReminderSync } from '@/src/notifications/ReminderSync';
import { FONT_CAP, useKeyboardVisible, useResponsive } from '@/src/hooks/useResponsive';
import { colors, fonts, gradients, layout } from '@/src/theme/tokens';

const TABS: { name: string; title: string; glyph: GlyphName }[] = [
  { name: 'index', title: 'Home', glyph: 'home' },
  { name: 'prayer', title: 'Prayer', glyph: 'mosque' },
  { name: 'events', title: 'Events', glyph: 'calendar' },
  { name: 'donate', title: 'Donate', glyph: 'give' },
  { name: 'more', title: 'More', glyph: 'more' },
];

const FLOATING_TAB_BAR_HEIGHT = layout.floatingTabBarHeight;

/**
 * Floating frosted-glass tab bar: a rounded capsule hovering above the home
 * indicator, with a lit gold "jewel" behind the active tab.
 */
function FloatingTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { compact, tablet } = useResponsive();
  const keyboard = useKeyboardVisible();
  // Sit just above the home indicator; on devices without one (iPhone SE,
  // Android 3-button nav) keep a comfortable 12pt gap.
  const bottom = Math.max(insets.bottom - 8, 12);
  // Hide while typing so the bar never rides up on top of the keyboard (Android resize mode).
  if (keyboard && Platform.OS === 'android') return null;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom, left: insets.left + (compact ? 10 : 14), right: insets.right + (compact ? 10 : 14) }]}
    >
      <View style={[styles.bar, tablet && styles.barTablet]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 50 : 30}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={[StyleSheet.absoluteFill, styles.radius]}
        />
        <LinearGradient
          colors={['rgba(28, 66, 99, 0.78)', 'rgba(9, 30, 48, 0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.radius]}
        />
        <View style={[StyleSheet.absoluteFill, styles.radius, styles.rim]} />

        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              triggerHaptic();
              navigation.navigate(route.name, route.params);
            }
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? `${tab.title} tab`}
              style={styles.item}
            >
              <View style={[styles.iconWrap, compact && styles.iconWrapCompact, focused && styles.iconWrapActive]}>
                {focused ? (
                  <>
                    <LinearGradient
                      colors={gradients.gold}
                      start={{ x: 0.1, y: 0 }}
                      end={{ x: 0.9, y: 1 }}
                      style={[StyleSheet.absoluteFill, styles.pillRadius]}
                    />
                    <LinearGradient
                      colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 0.7 }}
                      style={[StyleSheet.absoluteFill, styles.pillRadius]}
                    />
                  </>
                ) : null}
                <View style={styles.glyphLayer}>
                <Glyph
                  name={tab.glyph}
                  size={23}
                  color={focused ? colors.textOnGold : 'rgba(245, 240, 232, 0.66)'}
                  accent={focused ? colors.textOnGold : colors.gold}
                  toneOpacity={focused ? 0.22 : 0.18}
                  strokeWidth={focused ? 1.9 : 1.7}
                />
                </View>
              </View>
              <Text
                style={[styles.label, compact && styles.labelCompact, focused && styles.labelActive]}
                numberOfLines={1}
                maxFontSizeMultiplier={FONT_CAP.dense}
              >
                {tab.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <>
    <ReminderSync />
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{ title: t.title, tabBarAccessibilityLabel: `${t.title} tab` }}
        />
      ))}
    </Tabs>
    </>
  );
}

const R = 30;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center' },
  bar: {
    width: '100%',
    maxWidth: 480,
    height: FLOATING_TAB_BAR_HEIGHT,
    borderRadius: R,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.45), 0px 2px 6px rgba(0, 0, 0, 0.3)',
  },
  barTablet: { maxWidth: 520 },
  radius: { borderRadius: R, overflow: 'hidden' },
  rim: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: '100%' },
  iconWrap: {
    width: 50,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    boxShadow: '0px 4px 14px rgba(244, 148, 27, 0.45)',
  },
  iconWrapCompact: { width: 44 },
  pillRadius: { borderRadius: 16 },
  glyphLayer: { position: 'relative', zIndex: 1 },
  label: {
    fontFamily: fonts.uiSemi,
    fontSize: 10.5,
    letterSpacing: 0.2,
    color: 'rgba(245, 240, 232, 0.6)',
  },
  labelCompact: { fontSize: 10, letterSpacing: 0 },
  labelActive: { color: colors.gold },
});
