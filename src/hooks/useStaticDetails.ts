import { useEffect, useState } from 'react';
import { fetchStaticDetails, type StaticDetails } from '@/src/api/muslimoon';
import { brand } from '@/src/theme/tokens';

export type ResolvedStaticDetails = {
  youtubeChannelUrl: string;
  youtubeLiveUrl: string;
  /** 'cms' when YouTube came from Muslimoon org-settings, 'website' when from the brand fallback */
  youtubeSource: 'cms' | 'website';
  address: string;
  phone: string;
  email: string;
};

/** "/@x", "/channel/UC…", "/c/x" channel URL → its /live page. Video links stay as they are. */
function liveUrlFor(channelUrl: string): string {
  if (/\/(watch|live\/|shorts\/)|youtu\.be\//i.test(channelUrl)) return channelUrl;
  return `${channelUrl.replace(/\/+$/, '').replace(/\/(featured|videos|streams)$/i, '')}/live`;
}

let cache: StaticDetails | null = null;

function resolve(d: StaticDetails | null): ResolvedStaticDetails {
  const cmsYt = d?.youtubeUrl;
  return {
    youtubeChannelUrl: cmsYt ?? brand.youtube.channelUrl,
    youtubeLiveUrl: cmsYt ? liveUrlFor(cmsYt) : brand.youtube.liveUrl,
    youtubeSource: cmsYt ? 'cms' : 'website',
    address: d?.address ?? brand.address,
    phone: d?.phone ?? brand.phone,
    email: d?.email ?? brand.email,
  };
}

/**
 * Static details (YouTube, address, phone, email): Muslimoon org-settings when
 * set, otherwise the abuhuraira.org values in theme `brand`. Renders the
 * fallback immediately, so nothing waits on the network.
 */
export function useStaticDetails(): ResolvedStaticDetails {
  const [details, setDetails] = useState<StaticDetails | null>(cache);
  useEffect(() => {
    if (cache) return;
    let alive = true;
    fetchStaticDetails()
      .then((d) => {
        cache = d;
        if (alive) setDetails(d);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return resolve(details);
}
