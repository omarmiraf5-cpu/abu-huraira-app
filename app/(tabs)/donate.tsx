import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Screen } from '@/src/components/Screen';
import { HeroHeader } from '@/src/components/HeroHeader';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Badge } from '@/src/components/Badge';
import { Icon, type IconName } from '@/src/components/Icon';
import { IconBadge } from '@/src/components/IconBadge';
import { FONT_CAP } from '@/src/hooks/useResponsive';
import { JewelIcon, type JewelTone } from '@/src/components/icons/JewelIcon';
import { ProgressBar } from '@/src/components/ProgressBar';
import { PressableScale } from '@/src/components/PressableScale';
import { SectionHeader } from '@/src/components/SectionHeader';
import { TextField } from '@/src/components/TextField';
import {
  createPledge,
  fetchCampaigns,
  type Campaign,
} from '@/src/api/muslimoon';
import {
  SUGGESTED_AMOUNTS,
  FREQUENCIES,
  buildCheckoutUrl,
  CHECKOUT_PREFILLS,
  donationsConfig,
  type DonationFrequency,
} from '@/src/config/donations';
import { colors, locale, radii, spacing, typography } from '@/src/theme/tokens';

type Step = 1 | 2;

/** Demo profile toggle — development builds only, until real sign-in ships. */
const SHOW_MOCK_LOGIN = __DEV__;

const MOCK_USER = {
  name: 'AHC Supporter',
  email: 'supporter@example.com',
  phone: '+1 416 555 0100',
};

const CAMPAIGN_ICONS: Record<string, IconName> = {
  'dollar-a-day': 'sunrise',
  general: 'mosque',
  zakat: 'zakat',
  sadaqah: 'give',
};

const CAMPAIGN_TONES: Record<string, JewelTone> = {
  'dollar-a-day': 'gold',
  general: 'emerald',
  zakat: 'teal',
  sadaqah: 'rose',
};

const money = (n: number, digits = 0) =>
  new Intl.NumberFormat(locale.language, {
    style: 'currency',
    currency: locale.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

export default function DonateScreen() {
  const [step, setStep] = useState<Step>(1);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState('dollar-a-day');
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [frequency, setFrequency] = useState<DonationFrequency>('once');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

  useEffect(() => {
    fetchCampaigns().then((list) => {
      setCampaigns(list);
      if (list.length && !list.find((c) => c.id === campaignId)) {
        setCampaignId(list[0].id);
      }
    });
  }, [campaignId]);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === campaignId),
    [campaigns, campaignId],
  );

  const effectiveAmount = customAmount
    ? Number.parseFloat(customAmount) || 0
    : amount;
  const freq = FREQUENCIES.find((f) => f.key === frequency) ?? FREQUENCIES[0];

  const donor = loggedIn
    ? MOCK_USER
    : { name: name.trim(), email: email.trim(), phone: phone.trim() };

  const canContinue =
    effectiveAmount > 0 &&
    !!campaignId &&
    (loggedIn || (donor.name.length > 1 && donor.email.includes('@')));

  const onContinue = () => {
    setError(null);
    if (!canContinue) {
      setError('Please choose a campaign, amount, and contact details.');
      return;
    }
    setStep(2);
  };

  const onCheckout = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createPledge({
        campaignId,
        amount: effectiveAmount,
        frequency,
        name: donor.name,
        email: donor.email,
        phone: donor.phone || undefined,
      });

      // Hands IRM: name, email, amount, campaign, frequency — each only once
      // its query-param name is confirmed in src/config/donations.ts.
      const url = buildCheckoutUrl({
        amount: effectiveAmount,
        frequency,
        campaign: selectedCampaign?.name,
        campaignId,
        name: donor.name,
        email: donor.email,
      });

      // Opens AHC's IRM checkout in the in-app browser (SFSafariViewController /
      // Chrome Custom Tabs), so card details never touch this app.
      await WebBrowser.openBrowserAsync(url, {
        controlsColor: colors.gold,
        toolbarColor: colors.navy,
        dismissButtonStyle: 'done',
      });
    } catch {
      setError('Could not open checkout. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [campaignId, donor, effectiveAmount, frequency, selectedCampaign?.name]);

  return (
    <Screen
      scrollRef={scrollRef}
      header={
        <HeroHeader
          eyebrow={`Give · ${locale.currency}`}
          title="Donate"
          subtitle="Support Abu Huraira Center — every gift sustains worship, learning, and care."
        >
          <Stepper step={step} />
        </HeroHeader>
      }
    >
      {step === 1 ? (
        <View>
          <SectionHeader title="Choose a cause" style={styles.firstSection} />
          <View style={styles.campaignList}>
            {campaigns.map((c) => {
              const selected = c.id === campaignId;
              const pct = c.goal && c.raised !== undefined ? c.raised / c.goal : null;
              return (
                <PressableScale
                  key={c.id}
                  onPress={() => setCampaignId(c.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, checked: selected }}
                  accessibilityLabel={`${c.name}${c.description ? `. ${c.description}` : ''}`}
                  style={[styles.campaign, selected && styles.campaignSelected]}
                >
                  <View style={styles.campaignRow}>
                    <JewelIcon name={CAMPAIGN_ICONS[c.id] ?? 'heart'} tone={CAMPAIGN_TONES[c.id] ?? 'rose'} size="md" glow={selected} />
                    <View style={styles.flex}>
                      <View style={styles.campaignTitleRow}>
                        <Text style={[styles.campaignName, selected && styles.campaignNameSelected]}>
                          {c.name}
                        </Text>
                        {c.id === 'dollar-a-day' ? <Badge label="Popular" tone="gold" /> : null}
                      </View>
                      {c.description ? (
                        <Text style={styles.campaignDesc} numberOfLines={2}>
                          {c.description}
                        </Text>
                      ) : null}
                    </View>
                    <View style={[styles.radio, selected && styles.radioOn]}>
                      {selected ? <Icon name="checkmark" size={14} color={colors.textOnGold} /> : null}
                    </View>
                  </View>
                  {pct !== null ? (
                    <View style={styles.campaignProgress}>
                      <ProgressBar value={pct} accessibilityLabel={`${c.name} progress`} />
                      <Text style={styles.campaignProgressText}>
                        {money(c.raised ?? 0)} of {money(c.goal ?? 0)} · {Math.round(pct * 100)}%
                      </Text>
                    </View>
                  ) : null}
                </PressableScale>
              );
            })}
          </View>

          <SectionHeader title="Amount" eyebrow={locale.currency} />
          <View style={styles.amounts}>
            {SUGGESTED_AMOUNTS.map((a) => {
              const selected = !customAmount && amount === a;
              return (
                <PressableScale
                  key={a}
                  onPress={() => {
                    setAmount(a);
                    setCustomAmount('');
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, checked: selected }}
                  accessibilityLabel={`${a} dollars`}
                  style={[styles.amountChip, selected && styles.amountSelected]}
                >
                  <Text
                    style={[styles.amountText, selected && styles.amountTextSelected]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    maxFontSizeMultiplier={FONT_CAP.dense}
                  >
                    ${a}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          <View style={styles.customWrap}>
            <TextField
              placeholder="Custom amount"
              prefix="$"
              suffix={locale.currency}
              keyboardType="decimal-pad"
              value={customAmount}
              onChangeText={setCustomAmount}
              accessibilityLabel="Custom amount in Canadian dollars"
            />
          </View>

          <SectionHeader title="How often" eyebrow={frequency === 'once' ? 'One-time gift' : 'Recurring gift'} />
          <FrequencyPicker value={frequency} onChange={setFrequency} />
          {frequency !== 'once' ? (
            <Text style={styles.freqHint} maxFontSizeMultiplier={FONT_CAP.body}>
              {money(effectiveAmount || 0, effectiveAmount % 1 ? 2 : 0)} {freq.per}, set up and managed on AHC’s IRM checkout.
            </Text>
          ) : null}

          <SectionHeader title="Your details" />
          <Card padding={spacing.md}>
            {SHOW_MOCK_LOGIN ? (
            <View style={styles.switchRow}>
              <IconBadge name="people" size="sm" jewel="sapphire" glow={false} />
              <View style={styles.flex}>
                <Text style={styles.switchLabel}>Use mock logged-in profile</Text>
                <Text style={styles.switchHint}>Skip the form with a demo account</Text>
              </View>
              <Switch
                value={loggedIn}
                onValueChange={setLoggedIn}
                trackColor={{ false: colors.surfacePressed, true: colors.gold }}
                thumbColor={colors.pearl}
                ios_backgroundColor={colors.surfacePressed}
                accessibilityLabel="Use mock logged-in profile"
              />
            </View>
            ) : null}

            {!loggedIn ? (
              <View style={[styles.fields, !SHOW_MOCK_LOGIN && styles.fieldsFirst]}>
                <TextField
                  label="Name"
                  icon="person-outline"
                  placeholder="Full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
                <TextField
                  label="Email"
                  icon="mail-outline"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <TextField
                  label="Phone (optional)"
                  icon="call-outline"
                  placeholder="+1 ..."
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
            ) : (
              <View style={styles.profile}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>AS</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.mockTitle}>Logged in as</Text>
                  <Text style={styles.mockLine}>{MOCK_USER.name}</Text>
                  <Text style={styles.mockSub}>{MOCK_USER.email}</Text>
                </View>
                <Icon name="checkmark-circle" size={22} color={colors.success} />
              </View>
            )}
          </Card>

          {error ? <ErrorText text={error} /> : null}

          <Button
            label={effectiveAmount > 0 ? `Continue · ${money(effectiveAmount, effectiveAmount % 1 ? 2 : 0)}${freq.per ? ` ${freq.per}` : ''}` : 'Continue'}
            trailingIcon="arrow-forward"
            onPress={onContinue}
            disabled={!canContinue}
            style={styles.cta}
          />
          <View style={styles.secureRow}>
            <Icon name="lock-closed" size={12} color={colors.textTertiary} />
            <Text style={styles.secureText}>You’ll confirm before anything is charged.</Text>
          </View>
        </View>
      ) : (
        <View>
          <Card variant="featured" padding={0} style={styles.receipt}>
            <View style={styles.receiptHead}>
              <Text style={styles.receiptEyebrow}>Your gift</Text>
              <Text style={styles.receiptAmount} accessibilityLabel={`${effectiveAmount.toFixed(2)} ${locale.currency}`}>
                {locale.currencySymbol}
                {effectiveAmount.toFixed(2)}
              </Text>
              {freq.per ? <Text style={styles.receiptPer}>{freq.label.toLowerCase()} gift</Text> : null}
              <Badge label={selectedCampaign?.name ?? '—'} tone="gold" icon={CAMPAIGN_ICONS[campaignId] ?? 'heart-outline'} style={styles.receiptBadge} />
            </View>
            <View style={styles.perforation} />
            <View style={styles.receiptBody}>
              <Text style={styles.confirmTitle}>Confirm your gift</Text>
              <ConfirmRow label="Campaign" value={selectedCampaign?.name ?? '—'} />
              <ConfirmRow
                label="Amount"
                value={`${locale.currencySymbol}${effectiveAmount.toFixed(2)} ${locale.currency}`}
              />
              <ConfirmRow label="Frequency" value={freq.label} />
              <ConfirmRow label="Name" value={donor.name} />
              <ConfirmRow label="Email" value={donor.email} />
              {donor.phone ? (
                <ConfirmRow label="Phone" value={donor.phone} />
              ) : null}
            </View>
          </Card>

          {error ? <ErrorText text={error} /> : null}

          <Button
            label="Proceed to checkout"
            icon="lock-closed"
            onPress={onCheckout}
            loading={submitting}
            style={styles.cta}
          />
          <Button
            label="Back"
            variant="ghost"
            icon="arrow-back"
            onPress={() => setStep(1)}
            style={styles.back}
          />
          <View style={styles.fineprintWrap}>
            <Icon name="shield-checkmark-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.fineprint}>
              {CHECKOUT_PREFILLS
                ? `Payment is completed securely on AHC’s checkout (${donationsConfig.displayHost}).`
                : `You’ll confirm the fund, amount${frequency !== 'once' ? ' and schedule' : ''} and pay securely on AHC’s checkout (${donationsConfig.displayHost}).`}
            </Text>
          </View>
        </View>
      )}
    </Screen>
  );
}

function Stepper({ step }: { step: Step }) {
  const items = [
    { n: 1, label: 'Details' },
    { n: 2, label: 'Confirm' },
  ];
  return (
    <View style={styles.stepper} accessibilityRole="progressbar" accessibilityLabel={`Step ${step} of 2`}>
      {items.map((it) => {
        const active = step === it.n;
        const done = step > it.n;
        return (
          <View key={it.n} style={styles.stepItem}>
            <View style={[styles.stepBar, (active || done) && styles.stepBarOn]} />
            <View style={styles.stepLabelRow}>
              <View style={[styles.stepDot, (active || done) && styles.stepDotOn]}>
                {done ? (
                  <Icon name="checkmark" size={11} color={colors.textOnGold} />
                ) : (
                  <Text style={[styles.stepNum, active && styles.stepNumOn]}>{it.n}</Text>
                )}
              </View>
              <Text style={[styles.stepText, (active || done) && styles.stepTextOn]}>{it.label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** One-time / Daily / Weekly / Monthly — a segmented control on a sunken track. */
function FrequencyPicker({ value, onChange }: { value: DonationFrequency; onChange: (f: DonationFrequency) => void }) {
  return (
    <View style={styles.freqTrack} accessibilityRole="radiogroup" accessibilityLabel="Donation frequency">
      {FREQUENCIES.map((f) => {
        const selected = f.key === value;
        return (
          <PressableScale
            key={f.key}
            onPress={() => onChange(f.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={f.label}
            style={[styles.freqOption, selected && styles.freqOptionOn]}
          >
            <Text
              style={[styles.freqText, selected && styles.freqTextOn]}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={FONT_CAP.dense}
            >
              {f.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

function ErrorText({ text }: { text: string }) {
  return (
    <View style={styles.errorRow} accessibilityRole="alert">
      <Icon name="alert-circle-outline" size={16} color={colors.danger} />
      <Text style={styles.error}>{text}</Text>
    </View>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.confirmRow}>
      <Text style={styles.confirmLabel}>{label}</Text>
      <Text style={styles.confirmValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  firstSection: { marginTop: spacing.xs },
  /* Stepper */
  stepper: { flexDirection: 'row', gap: spacing.ms, marginTop: spacing.ml },
  stepItem: { flex: 1 },
  stepBar: { height: 4, borderRadius: 2, backgroundColor: colors.hairlineStrong },
  stepBarOn: { backgroundColor: colors.gold },
  stepLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  stepNum: { ...typography.caption, fontSize: 11, color: colors.textTertiary },
  stepNumOn: { color: colors.textOnGold },
  stepText: { ...typography.footnote, color: colors.textTertiary },
  stepTextOn: { color: colors.text, fontFamily: typography.headline.fontFamily },
  /* Campaigns */
  campaignList: { gap: spacing.ms },
  campaign: {
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  campaignSelected: { borderColor: colors.gold, backgroundColor: colors.surfaceRaised },
  campaignRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  campaignTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  campaignName: { ...typography.headline, color: colors.text },
  campaignNameSelected: { color: colors.gold },
  campaignDesc: { ...typography.footnote, color: colors.textSecondary, marginTop: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  campaignProgress: { marginTop: spacing.ms, paddingLeft: 40 + spacing.ms },
  campaignProgressText: { ...typography.caption, color: colors.textTertiary, marginTop: 6 },
  /* Amounts */
  amounts: { flexDirection: 'row', gap: spacing.sm },
  amountChip: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  amountText: { ...typography.numeric, fontSize: 16, color: colors.text },
  amountTextSelected: { color: colors.textOnGold, fontFamily: typography.numericLarge.fontFamily },
  customWrap: { marginTop: spacing.ms },
  /* Frequency */
  freqTrack: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  freqOption: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: 4,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqOptionOn: {
    backgroundColor: colors.gold,
    boxShadow: '0px 4px 14px rgba(244, 148, 27, 0.35)',
  },
  freqText: { ...typography.subhead, fontFamily: typography.headline.fontFamily, color: colors.textSecondary },
  freqTextOn: { color: colors.textOnGold },
  freqHint: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.sm, paddingHorizontal: spacing.xs },
  /* Details */
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  switchLabel: { ...typography.subhead, fontFamily: typography.headline.fontFamily, color: colors.text },
  switchHint: { ...typography.caption, color: colors.textTertiary, marginTop: 1 },
  fields: {
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  fieldsFirst: { marginTop: 0, paddingTop: 0, borderTopWidth: 0 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.ms,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentFillStrong,
    borderWidth: 1,
    borderColor: colors.goldHairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.headline, color: colors.gold },
  mockTitle: { ...typography.caption, color: colors.textTertiary },
  mockLine: { ...typography.headline, color: colors.text },
  mockSub: { ...typography.footnote, color: colors.textSecondary },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  error: { ...typography.subhead, color: colors.danger, flex: 1 },
  cta: { marginTop: spacing.lg },
  back: { marginTop: spacing.xs },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.ms },
  secureText: { ...typography.caption, color: colors.textTertiary },
  /* Receipt */
  receipt: { marginTop: spacing.xs },
  receiptHead: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.ml, paddingHorizontal: spacing.ml },
  receiptEyebrow: { ...typography.overline, color: colors.nur },
  receiptAmount: { ...typography.numericLarge, fontSize: 48, lineHeight: 56, color: colors.text, marginTop: spacing.xs },
  receiptBadge: { alignSelf: 'center', marginTop: spacing.sm },
  receiptPer: { ...typography.footnote, color: colors.textSecondary, marginTop: 2 },
  perforation: {
    marginHorizontal: spacing.ml,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.hairlineStrong,
  },
  receiptBody: { padding: spacing.ml },
  confirmTitle: { ...typography.title3, color: colors.text, marginBottom: spacing.md },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  confirmLabel: { ...typography.subhead, color: colors.textTertiary },
  confirmValue: {
    ...typography.subhead,
    fontFamily: typography.headline.fontFamily,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  fineprintWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  fineprint: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', flexShrink: 1 },
});
