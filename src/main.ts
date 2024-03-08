import { unlink } from 'fs/promises';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
//import Watcher from 'watcher';
import { Watcher } from './services/index.js';
import l from './logger.js';

dotenv.config();
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const __filename = fileURLToPath(import.meta.url);
const downloadManager = __filename.replace('main', 'download-manager');
const logger = l;

let blackhole: string | undefined = process.env.BLACKHOLE;
if (!blackhole && process.env.DATA) {
  blackhole = resolve(process.env.DATA, 'torrents');
}
if (!blackhole) {
  throw new Error('Missing blackhole configuration');
}
if (blackhole.startsWith('.')) {
  blackhole = resolve(__dirname, blackhole);
}

let watcher: Watcher | undefined;
try {
  logger.info('.: Real-Debrid Blackhole :.')
  logger.info(`Watching '${blackhole}'`);
  watcher = new Watcher(blackhole);
  
  const exit = () => {
    if (watcher) watcher.close();
    process.exit(0);
  }
  process.on('SIGTERM', () => {
    logger.info('\nSIGTERM signal received.');
    exit();
  });
  process.on('SIGINT', () => {
    logger.info('\nSIGINT signal received.');
    exit();
  });
  process.on('SIGQUIT', () => {
    logger.info('\nSIGQUIT signal received.');
    exit();
  });
  process.on('exit', () => {
    logger.info('Exiting');
  });

  watcher.on('add', (filePath: string) => {
    if (!filePath.endsWith('.torrent') && !filePath.endsWith('.magnet')) {
      logger.warn(`Ignored file '${filePath}', not a .torrent or .magnet`);
      return;
    }
    const child = spawn('node', [downloadManager, filePath]);
    child.on('exit', async (code, signal) => {
      logger.debug(`child process exited with code ${code} and signal ${signal}`);
      if (!code) {
        logger.debug(`Removing .torrent file '${filePath}'`);
        try {
          await unlink(filePath);
        }
        catch (ex) {
          logger.error(`Unable to remove .torrent file '${filePath}'`, ex)
        }
      }
      else {
        logger.debug(`The download was flawed, keeping .torrent file '${filePath}'`);
      }
    });
    child.stdout.on('data', (data) => {
      logger.debug(`child stdout:\n${data}`);
    });
    child.stderr.on('data', (data) => {
      logger.debug(`child stderr:\n${data}`);
    });
    child.on('close', (code, signal) => {
      logger.debug(`child process close all stdio with code ${code} and signal ${signal}`);
    });
    child.on('error ', (err) => {
      logger.debug('child process error ' + err);
    });
    child.on('disconnect ', () => {
      logger.debug('child process disconnected');
    });
  });
}
catch (ex) {
  if (watcher) {
    watcher.close();
  }
  logger.error(ex);
  process.exit(1);
}