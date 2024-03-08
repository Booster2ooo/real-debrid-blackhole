import { TorrentHosterAvailabilityMap } from './torrent-hoster-availability-map.js';

/**
 * Represents the Real-Debrid torrents availability map
 */
export interface TorrentAvailabilityMap {
  /** key: torrent sha1 hash */
  [key: string]: Array<TorrentHosterAvailabilityMap>;
}
