/**
 * Represents an item of the Real-Debird downloads history
 */
export interface DownloadHistoryInfo {
  id: string;
  filename: string;
  /* Mime Type of the file, guessed by the file extension */
  mimeType: string;
  /* bytes, 0 if unknown */
  filesize: number;
  /* Original link */
  link: string;
  /* Host main domain */
  host: string;
  /* Max Chunks allowed */
  chunks: number;
  /* Generated link */
  download: string;
  /* jsonDate */
  generated: string;
}