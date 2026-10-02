import type { ReactNode, RefObject } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, layout, spacing } from '@/src/theme/tokens';

type Props = {
  children: ReactNode;
  /** Full-bleed header (e.g. <HeroHeader/>) rendered above the padded content. */
  header?: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Optional handle, e.g. to scroll back to top between steps. */
  scrollRef?: RefObject<ScrollView | null>;
};

export function Screen({
  children,
  header,
  scroll = true,
  style,
  contentStyle,
  refreshing,
  onRefresh,
  scrollRef,
}: Props) {
  const insets = useSafeAreaInsets();
  const topPad = header ? 0 : insets.top + spacing.md;

  const body = (
    <>
      {header}
      <View style={[styles.content, !scroll && styles.flex, { paddingTop: header ? 0 : topPad }, contentStyle]}>
        {children}
      </View>
    </>
  );

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={gradients.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom - 8, 12) + layout.floatingTabBarHeight + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets
          contentInsetAdjustmentBehavior="never"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.gold}
                colors={[colors.gold]}
                progressBackgroundColor={colors.surfaceRaised}
                progressViewOffset={insets.top}
              />
            ) : undefined
          }
        >
          {body}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  content: {
    paddingHorizontal: layout.gutter,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
});
