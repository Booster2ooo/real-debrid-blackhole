import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import l from './logger.js';
import {
  IDownloader,
  TorrentInfo,
  TorrentReference,
  TorrentStatus,
  UnrestrictedLink
} from './models/index.js';
import { 
  Aria2Downloader,
  FetchDownloader,
  ReadDebridClient
} from './services/index.js';

dotenv.config();
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const argv = process.argv.slice(2);
const sleep = async (delay: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, delay));
const logger = l.child({}, { msgPrefix: '[DownloadManager]' });

(async() => {
  const target = argv?.[0];
  logger.debug(`target: '${target}'`);
  if (!target) {
    throw new Error('Missing torrent or magnet link');
  }
  let destination = process.env.DOWNLOADS;
  if (!destination && process.env.DATA) {
    logger.trace(`No DOWNLOADS directory provided, falling back on DATA`);
    destination = join(process.env.DATA, 'downloads');
  }
  if (!destination && process.env.DOWNLOADER?.toLowerCase() === 'fetch') {
    throw new Error(`Missing downloads destination configuration`);
  }
  if (destination?.startsWith('.')) {
    logger.trace(`Destination is relative, joining to __dirname`);
    destination = join(__dirname, destination);
  }
  logger.debug(`destination: '${destination}'`);
  logger.debug(`downloader: '${process.env.DOWNLOADER}' (${process.env.DOWNLOADER?.toLowerCase()})`);
  try {
    const content = await readFile(target);
    const rdClient: ReadDebridClient = new ReadDebridClient(process.env.REAL_DEBRID_TOKEN);
    let torrentRef: TorrentReference | undefined;
    if (target.endsWith('.magnet')) {
      logger.trace(`Target is a magnet`);
      torrentRef = await rdClient.addTorrentMagnet(content.toString());
    }
    else {
      logger.trace(`Target is a torrent`);
      torrentRef = await rdClient.addTorrent(content);
    }
    await rdClient.selectTorrentFiles(torrentRef.id);
    let completed = false;
    let torrentInfo!: TorrentInfo;
    while(!completed) {
      torrentInfo = await rdClient.getTorrentInfo(torrentRef.id);
      switch (torrentInfo.status) {
        case TorrentStatus.MagnetError:
        case TorrentStatus.Error:
        case TorrentStatus.Virus:
        case TorrentStatus.Dead:
        case TorrentStatus.WaitingFilesSelection: // They should be selected
          throw new Error(`Real-Debrid could not process the file, reason: '${torrentInfo.status}'`);      
        case TorrentStatus.Downloaded:
          completed = true;
          break;
        default:
          logger.trace(`Last torrent info status is '${torrentInfo.status}'`);
          await sleep(30 * 1000);
      }
    }
    const unrestrictedLinks: Array<UnrestrictedLink> = [];
    for(let restrictedLink of torrentInfo.links) {
      try {
        logger.trace(`Unrestricting '${restrictedLink}'`);
        unrestrictedLinks.push(await rdClient.unrestrictLink(restrictedLink));
      }
      catch(ex) {
        logger.warn(`Unable to unrestrict link '${restrictedLink}'`);
        process.exitCode = 1;
      }
    }
    if (unrestrictedLinks.length) {
      let downloader: IDownloader;
      switch(process.env.DOWNLOADER?.toLowerCase()) {
        case 'aria2':
          logger.debug(`Selected Aria2 downloader`);
          downloader = new Aria2Downloader();
          break;
        case 'fetch':
          logger.debug(`Selected Fetch downloader`);
          downloader = new FetchDownloader();
          break;
        default:
          logger.debug(`Selected no downloader, outputing links`);
          console.log(unrestrictedLinks.join('\n'));
          process.exit(0);
      }
      for(let unrestricted of unrestrictedLinks) {
        try {
          const { filename, download, filesize } = unrestricted;
          const fileDestination = join(destination!, filename);
          try {
            const stats = await stat(fileDestination);
            if (stats.size === filesize) {
              logger.trace(`A file with the same size already exists, skipping '${fileDestination}'`);
              continue;
            }
          }
          catch {}
          await downloader.download(download, fileDestination);
        }
        catch (ex) {
          logger.warn(`Failed to download from '${unrestricted.download}'`, ex);
          process.exitCode = 1;
        }
      }
      await downloader.destroy();
      const downloadsHistory = await rdClient.listDownloads();
      for(let unrestricted of unrestrictedLinks) {
        try {
          logger.debug(`Trying to remove '${unrestricted.download}' from history`, unrestricted);
          const { id } = downloadsHistory.find(dl => dl.download === unrestricted.download) ?? {};
          if (id) {
            logger.debug(`Found '${unrestricted.download}' in history`, unrestricted);
            await rdClient.deleteDownload(id);
          }
        }
        catch (ex) {
          logger.warn(`Failed to remove '${unrestricted.download}' from downloads history`, ex);
        }
      }
      logger.debug(`Removing torrent`, torrentInfo);
      await rdClient.deleteTorrent(torrentInfo.id);      
    }
    process.exit();
  }
  catch (ex) {
    logger.error(ex);
    process.exit(1);
  }
})();