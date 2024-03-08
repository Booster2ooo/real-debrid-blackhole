/**
 * Holds the torrent status on Real-Debrid
 */
export enum TorrentStatus {
  MagnetError = 'magnet_error',
  MagnetConversion = 'magnet_conversion',
  WaitingFilesSelection = 'waiting_files_selection',
  Queued = 'queued',
  Downloading = 'downloading',
  Downloaded = 'downloaded',
  Error = 'error',
  Virus = 'virus',
  Compressing = 'compressing',
  Uploading = 'uploading',
  Dead = 'dead'
}
