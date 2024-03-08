import { TorrentFileVariantAvailabilityMap } from './torrent-file-variant-availability-map.js';

/**
 * Represents the host map of an available torrent on Real-Debrid
 */
export interface TorrentHosterAvailabilityMap {
  /** key: hoster name, e.g. 'rd' */
  [key: string]: Array<TorrentFileVariantAvailabilityMap>;
}
