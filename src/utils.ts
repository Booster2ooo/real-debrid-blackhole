import { join, resolve } from 'path';
//import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
//const __dirname = fileURLToPath(new URL('.', import.meta.url));
const cwd = process.cwd();

/**
 * Resolves the provided path
 * @param path The path to be resolved
 * @param dataRelative The path relative to DATA if the provided path is empty
 */
export function resolvePath(path: string | undefined, dataRelative: string[]): string {
  path = path?.trim() || '';
  
  if (!path && process.env.DATA) {
    const to = join(...(dataRelative || []));
    path = resolve(process.env.DATA, to);
  }
  if (path.startsWith('.')) {
    path = resolve(cwd, path);
  }
  return path;
}