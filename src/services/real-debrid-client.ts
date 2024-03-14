import { stringify } from 'querystring';
import {
  DownloadHistoryInfo,
  PagerRequest,
  TorrentActiveCount,
  TorrentAvailabilityMap,
  TorrentHost,
  TorrentInfo,
  TorrentReference,
  UnrestrictedLink
} from '../models/index.js';
import l from '../logger.js';
import { retryableFetch } from '../utils.js';

const logger = l.child({}, { msgPrefix: '[ReadDebridClient]' });

/**
 * A client wrapping Real-Debrid.com API
 */
export class ReadDebridClient {
  #API_URI = 'https://api.real-debrid.com/rest/1.0';
  #token: string | undefined;
  constructor(
    token?: string
  ) {
    this.#token = token || process.env.REAL_DEBRID_TOKEN;
    if (!this.#token) {
      throw new Error('ReadDebridClient: missing API token');
    }
  }

  /**
   * Fetch, automatically adding token
   * @param input 
   * @param init 
   * @returns 
   */
  async #fetch<T>(input: string | URL, init?: RequestInit | undefined): Promise<T> {
    if (init?.body && init.body.constructor.name !== 'Buffer') {
      init.body = stringify(init.body as any);
    }
    const url = `${this.#API_URI}${input}`;
    const response = await retryableFetch(url, {
      headers: {
        'Authorization': 'Bearer ' + this.#token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      ...init
    });
    if (response.status >= 200 && response.status < 300) {
      return response.json().catch(() => Promise.resolve()).then(json => {
        logger.trace(`Got response payload`, { json });
        return json;
      }) as T;
    }
    let body: string | undefined;
    try {
      body = await response.text();
    }
    catch {}
    throw new Error(`ReadDebridClient: The server returned an error for '${url}': (${response.status}) ${response.statusText}` + body ? ` - ${body}` : '');
  }

  /**
   * Unrestrict a hoster link and get a new unrestricted link
   * @param link The original hoster link
   * @param password Password to unlock the file access hoster side
   * @param remote 0 or 1, use Remote traffic, dedicated servers and account sharing protections lifted
   */
  async unrestrictLink(link: string, password?: string, remote?: number): Promise<UnrestrictedLink> {
    const body: any = { link };
    if (password) {
      body.password = password;
    }
    if (remote) {
      body.remote = remote;
    }
    logger.trace(`Unrestricting link '${link}'`, { link, password, remote });
    return this.#fetch(`/unrestrict/link`, {
      method: 'POST',
      body
    })
  }

  /**
   * Get user downloads list
   * @param pager 
   * @returns 
   */
  async listDownloads(pager?: PagerRequest): Promise<Array<DownloadHistoryInfo>> {
    const params = stringify(pager as any);
    logger.trace(`Listing downloads`, { pager });
    return this.#fetch(`/downloads?${params}`);
  }

  /**
   * Delete a link from downloads list, returns 204 HTTP code
   * @param downloadId The id of the download to delete
   * @returns 
   */
  async deleteDownload(downloadId: string): Promise<void> {
    logger.trace(`Deleting download '${downloadId}'`, { downloadId });
    return this.#fetch(`/downloads/delete/${downloadId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get user torrents list
   * @param pager 
   * @returns 
   */
  async listTorrents(pager?: PagerRequest): Promise<Array<TorrentReference>> {
    const params = stringify(pager as any);
    logger.trace(`Listing torrents`, { pager });
    return this.#fetch(`/torrents?${params}`);
  }

  /**
   * Get all informations on the asked torrent
   * @param torrentId The id of the torrent to get the info for
   * @returns 
   */
  async getTorrentInfo(torrentId: string): Promise<TorrentInfo> {
    logger.trace(`Getting torrent info '${torrentId}'`, { torrentId });
    return this.#fetch(`/torrents/info/${torrentId}`);
  }

  /**
   * Get list of instantly available file IDs by hoster 
   * @param torrentHashes The SHA1 of the torrent(s)
   * @returns 
   */
  async getTorrentInstantAvailability(torrentHashes: string | Array<string>): Promise<TorrentAvailabilityMap> {
    if (Array.isArray(torrentHashes)) {
      torrentHashes = torrentHashes.join('/');
    }
    logger.trace(`Getting torrent availability '${torrentHashes}'`, { torrentHashes });
    return this.#fetch(`/torrents/instantAvailability/${torrentHashes}`);
  }

  /**
   * Get currently active torrents number and the current maximum limit
   * @returns 
   */
  async getActiveTorrentsCount(): Promise<TorrentActiveCount> {
    logger.trace(`Getting active torrents count`);
    return this.#fetch(`/torrents/activeCount`);
  }

  /**
   * Get available hosts to upload the torrent to
   * @returns 
   * 
   * Note: only returns [ { host: 'real-debrid.com', max_file_size: 2000 } ]
   */
  async getTorrentAvailableHosts(): Promise<Array<TorrentHost>> {
    logger.trace(`Getting available torrent hosts`);
    return this.#fetch(`/torrents/availableHosts`);
  }

  /**
   * Add a torrent file to download
   * @param torrent The torrent file content
   * @returns 
   */
  async addTorrent(torrent: Buffer): Promise<TorrentReference> {
    logger.trace(`Adding torrent`, { torrent });
    return this.#fetch(`/torrents/addTorrent`, {
      method: 'PUT',
      body: torrent
    });
  }

  /**
   * Add a magnet link to download
   * @param magnet The url of the magnet to download the torrent for
   * @returns 
   */
  async addTorrentMagnet(magnet : string): Promise<TorrentReference> {
    logger.trace(`Adding magnet '${magnet}'`, { magnet });
    return this.#fetch(`/torrents/addMagnet`, {
      method: 'POST',
      body: { magnet } as any
    });
  }

  /**
   * Select torrent's files to start the download for
   * @param torrentId The id of the torrent to select the files for 
   * @param files  One or more file id, or "all"
   */
  async selectTorrentFiles(torrentId: string, files : string | Array<string> | 'all' = 'all'): Promise<void> {
    if (Array.isArray(files)) {
      files = files.join(',');
    }
    logger.trace(`Selecting torrent files '${files}' of '${torrentId}'`, { torrentId, files });
    return this.#fetch(`/torrents/selectFiles/${torrentId}`, {
      method: 'POST',
      body: { files } as any
    });
  }

  /**
   * Delete a torrent from torrents list
   * @param torrentId The id of the torrent to delete
   */
  async deleteTorrent(torrentId: string): Promise<void> {
    logger.trace(`Deleting torrent '${torrentId}'`, { torrentId });
    return this.#fetch(`/torrents/delete/${torrentId}`, {
      method: 'DELETE'
    });
  }

}