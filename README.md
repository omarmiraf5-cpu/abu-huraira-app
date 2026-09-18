# AHC App — Design Preview Site

A standalone, self-contained preview of the five app screens. No build
step, no dependencies, no third-party branding. Upload and it works.

```
index.html          the whole site
assets/
  mark-light.png    logo for dark backgrounds
  mark-navy.png     logo for light backgrounds
```

The only external request is to Google Fonts. Everything else is local.

---

## Deploying it

### Option 1 — Netlify Drop (fastest, ~2 minutes)

1. Go to https://app.netlify.com/drop
2. Drag this whole folder onto the page.
3. You get a live URL immediately, e.g. `random-name.netlify.app`.
4. To use your own domain: Site settings → Domain management → add
   something like `ahc.buraaqtech.com`, then add the CNAME record it
   shows you at your DNS provider.

Free, HTTPS included.

### Option 2 — Your existing hosting

If buraaqtech.com is on cPanel or similar shared hosting, just upload
the folder via FTP or File Manager into a subfolder:

```
public_html/ahc-preview/
```

Then send `https://buraaqtech.com/ahc-preview/`.

### Option 3 — Vercel or Cloudflare Pages

Both work the same way as Netlify. Drop the folder or point them at a
Git repo. Free tier is more than enough.

---

## Before you send the link

- [ ] Open it on your **phone** as well as desktop — the layout scrolls
      sideways and you want to confirm that feels natural on mobile.
- [ ] Tap through everything: switch screens from the bottom tab bar,
      toggle a notification, pick a donation amount, hit RSVP.
- [ ] Check the logo appears on all five screens.
- [ ] Open the link in a private/incognito window to be sure it's
      publicly reachable and not cached from your own session.

---

## A note on what this is

This is a **design preview**, not the app. Nothing here connects to a
backend — the prayer times, events and amounts are sample content so
Mohamed can see the layout and flow. The real app code lives separately.

If he asks "can I install this?", the answer is not yet: this is for
approving the look and feel before development builds it for real.

---

## Sample content to replace before launch

| Where | Currently | Needs |
|---|---|---|
| Prayer times | Real times from abuhuraira.org (static, as of Sep 17 2026) | Live daily updates instead of a fixed table |
| Hijri date | 6 Rabi' al-Thānī 1448 | Live calculation |
| Events | Three known weekly classes | Full program list from AHC |
| Donation amounts | $10 / $25 / $50 / $100 | Confirm with AHC |
