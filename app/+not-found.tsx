import { Stack, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/EmptyState';
import { spacing } from '@/src/theme/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: false }} />
      <Screen scroll={false}>
        <View style={styles.center}>
          <EmptyState
            icon="compass-outline"
            title="This page doesn’t exist"
            body="The link may be broken or the page may have moved."
            actionLabel="Go to Home"
            onAction={() => router.replace('/')}
          />
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingBottom: spacing.xxxl },
});
