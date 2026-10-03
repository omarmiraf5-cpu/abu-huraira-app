import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Screen } from '@/src/components/Screen';
import { HeroHeader } from '@/src/components/HeroHeader';
import { Card } from '@/src/components/Card';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { ListGroup, ListRow } from '@/src/components/ListGroup';
import { PressableScale } from '@/src/components/PressableScale';
import { SectionHeader } from '@/src/components/SectionHeader';
import { FormRenderer } from '@/src/components/forms/FormRenderer';
import {
  FORM_SUBMISSION_ENABLED,
  fetchEventsResult,
  fetchFormSchema,
  findEventById,
  submitForm,
  type EventItem,
  type FormSchemaResult,
} from '@/src/api/muslimoon';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

const openUrl = (url: string) =>
  WebBrowser.openBrowserAsync(url, { controlsColor: colors.gold, toolbarColor: colors.navy, dismissButtonStyle: 'done' });

/** Class / event detail with schedule, instructor, fee, curriculum and registration. */
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<EventItem | null | undefined>(() => (id ? findEventById(String(id)) : undefined));

  useEffect(() => {
    if (item || !id) return;
    // Deep link / reload: fetch the list, then look again.
    let alive = true;
    fetchEventsResult()
      .then(() => alive && setItem(findEventById(String(id)) ?? null))
      .catch(() => alive && setItem(null));
    return () => {
      alive = false;
    };
  }, [id, item]);

  const back = (
    <PressableScale onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/events'))} style={styles.back} accessibilityLabel="Back">
      <Icon name="chevron-back" size={18} color={colors.text} />
      <Text style={styles.backText}>Events</Text>
    </PressableScale>
  );

  if (!item) {
    return (
      <Screen header={<HeroHeader top={back} eyebrow="Events" title={item === null ? 'Not found' : 'Loading…'} />}>
        {item === null ? (
          <EmptyState icon="calendar-outline" title="This item isn’t available" body="It may have ended or been removed." actionLabel="All events" onAction={() => router.replace('/(tabs)/events')} />
        ) : (
          <Card padding={spacing.xl}>
            <ActivityIndicator color={colors.gold} />
          </Card>
        )}
      </Screen>
    );
  }

  const reg = item.registration;
  const when = item.kind === 'class' ? item.schedule ?? item.date : [item.date, item.schedule].filter(Boolean).join(' · ');

  return (
    <Screen
      header={
        <HeroHeader
          top={back}
          eyebrow={item.category ?? (item.kind === 'class' ? 'Class' : 'Event')}
          title={item.title}
          subtitle={item.instructor ? `with ${item.instructor}` : undefined}
          right={item.demo ? <Badge label="Preview" tone="gold" icon="sparkles-outline" /> : undefined}
        />
      }
    >
      {item.demo ? (
        <Card variant="sunken" padding={spacing.md} style={styles.notice}>
          <View style={styles.noticeRow}>
            <Icon name="information-circle-outline" size={18} color={colors.nur} />
            <Text style={styles.noticeText}>
              <Text style={styles.noticeStrong}>Preview from abuhuraira.org. </Text>
              Details may change. AHC will publish this in the app soon.
            </Text>
          </View>
        </Card>
      ) : null}

      <ListGroup>
        {when ? <ListRow icon="calendar" tone="violet" title={item.kind === 'class' ? 'Schedule' : 'Date'} subtitle={when} /> : null}
        {item.time ? <ListRow icon="clock" tone="gold" title="Time" subtitle={item.time} /> : null}
        {item.location ? (
          <ListRow
            icon="pin"
            tone="rose"
            title="Location"
            subtitle={item.location}
            trailingIcon="open-outline"
            chevron={false}
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location!)}`)}
            accessibilityHint="Opens maps"
          />
        ) : null}
        {item.instructor ? <ListRow icon="people" tone="sapphire" title="Instructor" subtitle={item.instructor} /> : null}
        {item.fee ? <ListRow icon="give" tone="emerald" title="Fee" subtitle={item.fee} /> : null}
        {item.audience ? <ListRow icon="sparkles" tone="teal" title="Who it’s for" subtitle={item.audience} /> : null}
      </ListGroup>

      {item.body || item.description ? (
        <>
          <SectionHeader title="About" />
          <Card>
            <Text style={styles.body}>{item.body ?? item.description}</Text>
          </Card>
        </>
      ) : null}

      {item.curriculum && item.curriculum.length > 0 ? (
        <>
          <SectionHeader title="What you’ll learn" />
          <Card>
            <View style={styles.curriculum}>
              {item.curriculum.map((c) => (
                <View key={c} style={styles.currRow}>
                  <View style={styles.currDot}>
                    <Icon name="checkmark" size={12} color={colors.textOnGold} />
                  </View>
                  <Text style={styles.currText}>{c}</Text>
                </View>
              ))}
            </View>
          </Card>
        </>
      ) : null}

      <SectionHeader title="Registration" />
      <Registration item={item} />

      {item.contactEmail || item.contactPhone ? (
        <>
          <SectionHeader title="Questions" />
          <ListGroup>
            {item.contactEmail ? (
              <ListRow icon="mail" tone="sapphire" title="Email" subtitle={item.contactEmail} onPress={() => Linking.openURL(`mailto:${item.contactEmail}`)} />
            ) : null}
            {item.contactPhone ? (
              <ListRow icon="phone" tone="teal" title="Phone" subtitle={item.contactPhone} onPress={() => Linking.openURL(`tel:${item.contactPhone!.replace(/[^\d+]/g, '')}`)} />
            ) : null}
          </ListGroup>
        </>
      ) : null}
    </Screen>
  );
}

function Registration({ item }: { item: EventItem }) {
  const reg = item.registration;
  const [form, setForm] = useState<FormSchemaResult | 'loading' | null>(reg?.formId ? 'loading' : null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!reg?.formId) return;
    let alive = true;
    fetchFormSchema(reg.formId).then((r) => alive && setForm(r));
    return () => {
      alive = false;
    };
  }, [reg?.formId]);

  if (reg?.closed) {
    return (
      <Card padding={spacing.md}>
        <View style={styles.noticeRow}>
          <Icon name="lock-closed" size={16} color={colors.textTertiary} />
          <Text style={styles.noticeText}>Registration for this program is closed.</Text>
        </View>
      </Card>
    );
  }

  const external = reg?.url ? (
    <Button
      label={reg.label ?? (reg.required ? 'Register' : 'Sign up')}
      icon="create-outline"
      trailingIcon="open-outline"
      onPress={() => openUrl(reg.url!)}
      accessibilityHint="Opens the registration form"
    />
  ) : null;

  if (!reg || (!reg.required && !reg.url && !reg.formId)) {
    return (
      <Card padding={spacing.md}>
        <View style={styles.noticeRow}>
          <Icon name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.noticeText}>
            <Text style={styles.noticeStrong}>No registration needed. </Text>
            Just come along.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.regWrap}>
      {external}
      {reg.required && !reg.url && !reg.formId ? (
        <Text style={styles.fine}>Registration is required. Contact the masjid to sign up.</Text>
      ) : null}
      {form === 'loading' ? (
        <Card padding={spacing.lg}>
          <ActivityIndicator color={colors.gold} />
        </Card>
      ) : form && form.status === 'ok' ? (
        <Card variant="featured" padding={spacing.ml}>
          {form.schema.demo ? <Badge label="Preview · in-app form" tone="gold" icon="sparkles-outline" style={styles.formBadge} /> : null}
          <FormRenderer
            schema={form.schema}
            submitEnabled={FORM_SUBMISSION_ENABLED && !form.schema.demo}
            onSubmit={async (values) => {
              // TODO(Muslimoon): wire once the public submit route is confirmed — see submitForm().
              const r = await submitForm(form.schema.id, values);
              if (!r.ok) setNote('In-app registration isn’t switched on yet. Please use the registration link above.');
            }}
          />
          <Text style={styles.fine}>
            {form.schema.demo
              ? 'This shows how a Muslimoon registration form will look in the app. It can’t be submitted yet; use the registration link above.'
              : 'In-app submission is coming soon. Use the registration link above for now.'}
          </Text>
          {note ? <Text style={styles.fine}>{note}</Text> : null}
        </Card>
      ) : form && !reg.url ? (
        <Text style={styles.fine}>The registration form isn’t available right now. Please contact the masjid.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backText: { ...typography.subhead, fontFamily: typography.headline.fontFamily, color: colors.text },
  notice: { marginBottom: spacing.md },
  noticeRow: { flexDirection: 'row', gap: spacing.ms, alignItems: 'flex-start' },
  noticeText: { ...typography.footnote, color: colors.textSecondary, flex: 1 },
  noticeStrong: { fontFamily: typography.headline.fontFamily, color: colors.text },
  body: { ...typography.callout, color: colors.textSecondary },
  curriculum: { gap: spacing.ms },
  currRow: { flexDirection: 'row', gap: spacing.ms, alignItems: 'flex-start' },
  currDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  currText: { ...typography.subhead, color: colors.text, flex: 1 },
  regWrap: { gap: spacing.md },
  formBadge: { alignSelf: 'flex-start', marginBottom: spacing.md },
  fine: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.md, textAlign: 'center' },
});
