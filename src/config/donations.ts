/**
 * Donation checkout configuration — IRM (irm.io).
 *
 * Checkout link provided by AHC (Sheikh Amaar, 2026-10-01):
 *   https://app.irm.io/abuhuraira.org/e/checkout
 *
 * All provider details live in this file, so a future change of provider or
 * URL is a one-file edit.
 *
 * Pre-filling: IRM's query parameter names (amount / fund / campaign) are NOT
 * confirmed yet, so `prefillParams` is empty and nothing is appended to the
 * URL — the donor picks the fund and amount on IRM's page. Once IT or IRM
 * confirms the parameter names, set them below and they'll be sent
 * automatically. Personal details (name, email, phone) are deliberately never
 * put in the URL: query strings end up in browser history and server logs.
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
   */
  prefillParams: {} as Partial<Record<'amount' | 'campaign' | 'campaignId', string>>,
} as const;

export type CheckoutParams = {
  amount: number;
  campaign?: string;
  campaignId?: string;
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
  return url.toString();
}

export const SUGGESTED_AMOUNTS = [25, 50, 100, 250, 500] as const;
