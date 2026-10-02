import type { IconName } from '../Icon';
import type { JewelTone } from '../icons/JewelIcon';

const ICONS: Record<string, IconName> = {
  fajr: 'fajr',
  sunrise: 'sunrise',
  dhuhr: 'dhuhr',
  asr: 'asr',
  maghrib: 'maghrib',
  isha: 'isha',
  jummah1: 'mosque',
  jummah2: 'mosque',
  jummah3: 'mosque',
  taraweeh: 'crescent',
  tahajjud: 'isha',
};

export function prayerIcon(key: string): IconName {
  if (ICONS[key]) return ICONS[key];
  if (key.startsWith('eid')) return 'sparkles';
  return 'clock';
}

const TONES: Record<string, JewelTone> = {
  fajr: 'fajr',
  dhuhr: 'dhuhr',
  asr: 'asr',
  maghrib: 'maghrib',
  isha: 'isha',
  taraweeh: 'isha',
  tahajjud: 'isha',
};

/** Jewel palette that matches the sky at each prayer. */
export function prayerTone(key: string): JewelTone {
  if (TONES[key]) return TONES[key];
  if (key.startsWith('jummah')) return 'emerald';
  if (key.startsWith('eid')) return 'gold';
  return 'slate';
}
