/**
 * Represents a torrent file on Real-Debrid
 */
export interface TorrentFile {
  id: string;
  /* Path to the file inside the torrent, starting with "/" */
  path: string;
  bytes: string;
  /* 0 or 1 */
  selected: number;
}
