/**
 * Donation checkout configuration — IRM (irm.io).
 *
 * Checkout link provided by AHC (Sheikh Amaar, 2026-10-01):
 *   https://app.irm.io/abuhuraira.org/e/checkout
 *
 * All provider details live in this file, so a future change of provider or
 * URL is a one-file edit.
 *
 * Pre-filling (Amaar, 2026-10-02): IRM accepts donor name, email, amount,
 * campaign (must already exist in IRM's own dashboard), and frequency
 * (`d`/`w`/`m`) as pass-through values — but the exact query parameter
 * *names* IRM expects for each are still unconfirmed, so `prefillParams`
 * stays empty until that's nailed down.
 *
 * No tax-receipt API — AHC's IRM/masjid-admin dashboard handles receipts on
 * its own, out of scope for this app (confirmed by Amaar, 2026-10-02). Also
 * no payment-status webhook: IRM doesn't support 2-way communication, so
 * this app has no way to know whether a donation (or a paid program
 * registration) actually went through — see CLAUDE.md.
 *
 * Name/email conflict with existing policy: this file has deliberately never
 * put personal details in the URL (query strings end up in browser history
 * and server logs) — but IRM accepting name/email as params suggests their
 * checkout may expect them. Before wiring those two up, confirm with Amaar
 * whether IRM can work without them in the URL (donor fills them in on
 * IRM's own page) — amount/campaign/frequency aren't PII and are safe to
 * add once the param names are known.
 */

export const donationsConfig = {
  provider: 'IRM',
  checkoutUrl: 'https://app.irm.io/abuhuraira.org/e/checkout',
  /** Display host shown to donors before they leave the app. */
  displayHost: 'app.irm.io',
  currency: 'CAD',
  locale: 'en-CA',
  /**
   * Query parameter names IRM accepts for pre-filling, once confirmed.
   * e.g. { amount: 'amount', campaign: 'fund' }. Leave a key out to skip it.
   * Deliberately excludes donor name/email — see file comment above.
   */
  prefillParams: {} as Partial<Record<'amount' | 'campaign' | 'campaignId' | 'frequency', string>>,
} as const;

export type DonationFrequency = 'd' | 'w' | 'm';

export type CheckoutParams = {
  amount: number;
  campaign?: string;
  campaignId?: string;
  frequency?: DonationFrequency;
};

/** True once at least one pre-fill parameter is configured. */
export const CHECKOUT_PREFILLS = Object.keys(donationsConfig.prefillParams).length > 0;

/** Build the IRM checkout URL (with pre-fill params only when configured). */
export function buildCheckoutUrl(params: CheckoutParams): string {
  const url = new URL(donationsConfig.checkoutUrl);
  const keys = donationsConfig.prefillParams;
  if (keys.amount && params.amount > 0) url.searchParams.set(keys.amount, String(params.amount));
  if (keys.campaign && params.campaign) url.searchParams.set(keys.campaign, params.campaign);
  if (keys.campaignId && params.campaignId) url.searchParams.set(keys.campaignId, params.campaignId);
  if (keys.frequency && params.frequency) url.searchParams.set(keys.frequency, params.frequency);
  return url.toString();
}

export const SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500] as const;
