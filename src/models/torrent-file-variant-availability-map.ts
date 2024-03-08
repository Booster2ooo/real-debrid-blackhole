import { TorrentFileAvailability } from './torrent-file-availability.js';

/**
 * Represents the variations of an available torrent file on Real-Debrid
 */
export interface TorrentFileVariantAvailabilityMap {
  /** key: file ID, you must ask all file IDs from this array on /selectFiles to get instant downloading */
  [key: string]: TorrentFileAvailability;
}
