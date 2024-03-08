import { TorrentFile } from './torrent-file.js';
import { TorrentStatus } from './torrent-status.js';

/**
 * Represents a torrent on Real-Debrid
 */
export interface TorrentInfo {
  id: string;
  filename: string;
  /* Original name of the torrent */
  original_filename: string;
  /* SHA1 Hash of the torrent */
  hash: string;
  /* Size of selected files only */
  bytes: number;
  /* Total size of the torrent */
  original_bytes: number;
  /* Host main domain */
  host: string;
  /* Split size of links */
  split: number;
  /* Possible values: 0 to 100 */
  progress: number;
  /* Current status of the torrent: magnet_error, magnet_conversion, waiting_files_selection, queued, downloading, downloaded, error, virus, compressing, uploading, dead */
  status: TorrentStatus;
  /* jsonDate */
  added: string;
  files: Array<TorrentFile>;
  links: Array<string>;
  /* Only present when finished, jsonDate */
  ended: string;
  /* Only present in "downloading", "compressing", "uploading" status */
  speed: number;
  /* Only present in "downloading", "magnet_conversion" status */
  seeders: number;
}
