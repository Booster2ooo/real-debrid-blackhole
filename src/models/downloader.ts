/**
 * Represents a service used to download files
 */
export interface IDownloader {
  /**
   * Download the provided url to the specified location
   * @param url 
   * @param destination 
   */
  download(url: string, destination: string): Promise<void>;

  /**
   * Free the downloaders resources
   */
  destroy(): Promise<void>;
}