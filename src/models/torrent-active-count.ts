/**
 * Represents the number of active torrents on Real-Debrid
 */
export interface TorrentActiveCount {
  /* Number of currently active torrents */
  nb: number;
  /* Maximum number of active torrents you can have */
  limit: number;
}
