/**
 * YouTube Data API v3 helpers — plain REST calls (no `googleapis` dependency,
 * keeps cold starts fast). The API key never reaches the client; it's a
 * Firebase secret, read only inside these functions.
 *
 * Quota matters here: the default project quota is 10,000 units/day.
 *   - channels.list / playlistItems.list cost 1 unit each.
 *   - search.list costs 100 units — the *only* official way to detect a live
 *     broadcast, but expensive. Polling it every 5 minutes would burn
 *     100 * 288 = 28,800 units/day, well over budget.
 * So: "latest videos" uses the cheap playlistItems.list path, and the live
 * check is meant to run on a longer interval (see checkYoutubeLive's
 * schedule) with the uploads-playlist id cached indefinitely in Firestore,
 * since a channel's uploads playlist id never changes.
 *
 * A more efficient live-detection path exists — YouTube's PubSubHubbub/WebSub
 * push feed notifies a public HTTPS endpoint the moment a channel uploads or
 * goes live, no polling or quota cost at all. Worth moving to once this is
 * proven out; it needs a public callback endpoint and periodic lease renewal,
 * more setup than today's "get something working" pass justifies.
 */
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const API_BASE = 'https://www.googleapis.com/youtube/v3';
const UPLOADS_PLAYLIST_CACHE_DOC = 'youtubeState/uploadsPlaylist';
const LATEST_VIDEOS_CACHE_DOC = 'youtubeState/latestVideosCache';
const LATEST_VIDEOS_CACHE_TTL_MS = 10 * 60_000; // 10 minutes

export type YoutubeVideo = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl?: string;
};

async function youtubeGet<T>(path: string, params: Record<string, string>, apiKey: string): Promise<T> {
  const url = new URL(`${API_BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('key', apiKey);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`YouTube API ${path} failed: HTTP ${res.status} ${body}`);
  }
  return (await res.json()) as T;
}

/** The channel's "uploads" playlist id — cached forever once found (1 API unit on first call only). */
async function getUploadsPlaylistId(channelId: string, apiKey: string): Promise<string> {
  const db = getFirestore();
  const cacheRef = db.doc(UPLOADS_PLAYLIST_CACHE_DOC);
  const cached = await cacheRef.get();
  const data = cached.data();
  if (data?.channelId === channelId && typeof data.playlistId === 'string') {
    return data.playlistId;
  }

  type ChannelsResponse = { items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[] };
  const json = await youtubeGet<ChannelsResponse>('channels', { part: 'contentDetails', id: channelId }, apiKey);
  const playlistId = json.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) throw new Error(`No uploads playlist found for channel ${channelId}`);

  await cacheRef.set({ channelId, playlistId, cachedAt: Timestamp.now() });
  return playlistId;
}

/** Latest uploaded videos, cheap (1 unit) via the uploads playlist, cached for LATEST_VIDEOS_CACHE_TTL_MS. */
export async function getLatestVideos(channelId: string, apiKey: string, maxResults = 10): Promise<YoutubeVideo[]> {
  const db = getFirestore();
  const cacheRef = db.doc(LATEST_VIDEOS_CACHE_DOC);
  const cached = await cacheRef.get();
  const data = cached.data();
  const cachedAt = (data?.cachedAt as Timestamp | undefined)?.toMillis() ?? 0;
  if (data?.channelId === channelId && Array.isArray(data.videos) && Date.now() - cachedAt < LATEST_VIDEOS_CACHE_TTL_MS) {
    return data.videos as YoutubeVideo[];
  }

  const uploadsPlaylistId = await getUploadsPlaylistId(channelId, apiKey);
  type PlaylistItemsResponse = {
    items?: {
      snippet?: {
        title?: string;
        publishedAt?: string;
        resourceId?: { videoId?: string };
        thumbnails?: { medium?: { url?: string } };
      };
    }[];
  };
  const json = await youtubeGet<PlaylistItemsResponse>(
    'playlistItems',
    { part: 'snippet', playlistId: uploadsPlaylistId, maxResults: String(maxResults) },
    apiKey,
  );
  const videos: YoutubeVideo[] = (json.items ?? []).flatMap((item) => {
    const id = item.snippet?.resourceId?.videoId;
    const title = item.snippet?.title;
    const publishedAt = item.snippet?.publishedAt;
    if (!id || !title || !publishedAt) return [];
    return [{ id, title, publishedAt, thumbnailUrl: item.snippet?.thumbnails?.medium?.url }];
  });

  await cacheRef.set({ channelId, videos, cachedAt: Timestamp.now() });
  return videos;
}

/** Is the channel live right now? Expensive (100 units) — call sparingly, see module comment. */
export async function checkIsLive(channelId: string, apiKey: string): Promise<{ isLive: boolean; videoId?: string; title?: string }> {
  type SearchResponse = { items?: { id?: { videoId?: string }; snippet?: { title?: string } }[] };
  const json = await youtubeGet<SearchResponse>(
    'search',
    { part: 'snippet', channelId, eventType: 'live', type: 'video' },
    apiKey,
  );
  const first = json.items?.[0];
  const videoId = first?.id?.videoId;
  if (!videoId) return { isLive: false };
  return { isLive: true, videoId, title: first?.snippet?.title };
}
