/**
 * Donation checkout configuration — IRM (irm.io).
 *
 * Receipts: IRM issues tax receipts. The app collects nothing for receipts and
 * shows no receipt UI (Amaar, Muslimoon, 2026-10-02).
 *
 * What we may pass to IRM (Amaar, 2026-10-02): donor name, email, amount,
 * campaign (already created on the IRM dashboard) and frequency (probably
 * d/w/m for daily/weekly/monthly). We do NOT yet have a sample checkout link,
 * so the base URL and every query-parameter name below are PLACEHOLDERS.
 *
 *   ┌──────────────────────────────────────────────────────────────────────┐
 *   │ PLACEHOLDER until Amaar sends a sample IRM link:                      │
 *   │   - checkoutUrl            (AHC gave .../e/checkout on 2026-10-01)    │
 *   │   - prefillParams.*        (all null → nothing is appended)           │
 *   │   - frequencyCodes         (d / w / m per Amaar's "probably")         │
 *   │   - irmCampaigns           (slugs seen on abuhuraira.org/donate)      │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * Until a param name is set it is simply not sent, so today the donor confirms
 * cause, amount and frequency on IRM's own page. Setting a name turns that
 * field on — no screen changes needed.
 *
 * Privacy: name/email in a URL end up in browser history and server logs.
 * They're included only because IRM can take them and Amaar listed them; leave
 * `prefillParams.name/email` null if IT prefers donors to type them on IRM.
 *
 * Research notes (public IRM page JS, 2026-10-02 — unconfirmed, NOT enabled):
 * IRM campaign pages live at https://app.irm.io/abuhuraira.org/<campaign-slug>
 * and accept /<slug>/<amount>/<frequency> path segments and ?a=<amount>&f=<frequency>
 * query params, where frequency is matched against the campaign's own option
 * labels (e.g. "Monthly"). See docs/muslimoon-api.md → "Donations / IRM".
 */

export type DonationFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

export const FREQUENCIES: { key: DonationFrequency; label: string; short: string; per: string }[] = [
  { key: 'once', label: 'One-time', short: 'Once', per: '' },
  { key: 'daily', label: 'Daily', short: 'Daily', per: '/ day' },
  { key: 'weekly', label: 'Weekly', short: 'Weekly', per: '/ week' },
  { key: 'monthly', label: 'Monthly', short: 'Monthly', per: '/ month' },
];

type PrefillKey = 'name' | 'email' | 'amount' | 'campaign' | 'frequency';

export const donationsConfig = {
  provider: 'IRM',
  /** PLACEHOLDER — checkout link provided by AHC (Sheikh Amaar, 2026-10-01). Confirm with a sample link. */
  checkoutUrl: 'https://app.irm.io/abuhuraira.org/e/checkout',
  /** Display host shown to donors before they leave the app. */
  displayHost: 'app.irm.io',
  currency: 'CAD',
  locale: 'en-CA',
  /**
   * PLACEHOLDER query-parameter names IRM accepts for pre-filling.
   * null = not confirmed → not sent. e.g. { amount: 'amount', frequency: 'frequency', ... }
   */
  prefillParams: {
    name: null,
    email: null,
    amount: null,
    campaign: null,
    frequency: null,
  } as Record<PrefillKey, string | null>,
  /**
   * PLACEHOLDER frequency codes (Amaar: "probably d/w/m"). One-time sends no
   * frequency param (null) unless IRM wants an explicit code.
   */
  frequencyCodes: {
    once: null,
    daily: 'd',
    weekly: 'w',
    monthly: 'm',
  } as Record<DonationFrequency, string | null>,
  /**
   * PLACEHOLDER app cause id → IRM campaign identifier. Values are the
   * campaign slugs linked from abuhuraira.org/donate (2026-10-02); confirm the
   * identifier IRM expects in the checkout link. null = let the donor choose on IRM.
   */
  irmCampaigns: {
    general: 'masjid-operation',
    zakat: 'zakat-al-maal',
    sadaqah: 'sadaqah',
    'dollar-a-day': null,
    'automate-your-jummah': 'automate-your-jummah',
  } as Record<string, string | null>,
} as const;

export type CheckoutParams = {
  amount: number;
  frequency?: DonationFrequency;
  /** App cause id (mapped through irmCampaigns) */
  campaignId?: string;
  /** Cause display name (used only if a campaign has no IRM mapping and IRM accepts names) */
  campaign?: string;
  name?: string;
  email?: string;
};

/** True once at least one pre-fill parameter is configured. */
export const CHECKOUT_PREFILLS = Object.values(donationsConfig.prefillParams).some(Boolean);

/** The values that would be handed to IRM, before param-name mapping (for review / debugging). */
export function checkoutHandoff(params: CheckoutParams) {
  const freq = params.frequency ?? 'once';
  return {
    name: params.name?.trim() || undefined,
    email: params.email?.trim() || undefined,
    amount: params.amount > 0 ? params.amount : undefined,
    campaign: (params.campaignId && donationsConfig.irmCampaigns[params.campaignId]) || undefined,
    frequency: donationsConfig.frequencyCodes[freq] ?? undefined,
  } satisfies Record<PrefillKey, string | number | undefined>;
}

/** Build the IRM checkout URL, appending only the fields whose param names are confirmed. */
export function buildCheckoutUrl(params: CheckoutParams): string {
  const url = new URL(donationsConfig.checkoutUrl);
  const values = checkoutHandoff(params);
  (Object.keys(values) as PrefillKey[]).forEach((k) => {
    const name = donationsConfig.prefillParams[k];
    const v = values[k];
    if (name && v !== undefined && v !== '') url.searchParams.set(name, String(v));
  });
  return url.toString();
}

export const SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500] as const;
