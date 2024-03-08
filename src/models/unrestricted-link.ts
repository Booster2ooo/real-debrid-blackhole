/**
 * Represents an unrestricted link response on Real-Debrid
 */
export interface UnrestrictedLink {
  id: string;
  filename: string;
  /* Mime Type of the file, guessed by the file extension */
  mimeType: string;
  /* Filesize in bytes, 0 if unknown */
  filesize: number;
  /* Original link */
  link: string;
  /* Host main domain */
  host: string;
  /* Max Chunks allowed */
  chunks: number;
  /* Disable / enable CRC check  */
  crc: number;
  /* Generated link */
  download: string;
  /* Is the file streamable on website */
  streamable: number;
}