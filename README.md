# real-debrid-client
 A torrent blackhole using Real-Debrid as client.
 
 **Please respect the law, don't use this software to download materials you don't have the rights for.**

## Config
Configuration via env variables (see `docker-compose.yml` ):
| Key | Description |
| --- | --- |
| REAL_DEBRID_TOKEN | Your Real-Debrid.com token. Get it from https://real-debrid.com/apitoken |
| BLACKHOLE | A directory where to pick up .torrent or .magnet files from (overrides DATA) |
| DOWNLOADS | A directory where the media will be downloaded to (overrides DATA) |
| DATA | A directory containing both a `torrents/` (blackhole - input) and a `downloads/` (downloads - output) directories |
| DOWNLOADER | The downloader to use (see below) |
| LOG_LEVEL | A [pino](https://github.com/pinojs/pino) log level |
| ARIA2_HOST | (For Aria2 downloader) The Aria2 server host |
| ARIA2_PORT | (For Aria2 downloader) The Aria2 server port |
| ARIA2_PATH | (For Aria2 downloader) The Aria2 server json rpc path |
| ARIA2_SECURE | (For Aria2 downloader) true for https, false otherwise |
| ARIA2_SECRET | (For Aria2 downloader) The Aria2 server rpc secret |

## Downloaders
The app features 3 downloader:
- Aria2: (prefered) delegates the download process to an [Aria2](https://aria2.github.io/) server
- Fetch: uses internal NodeJS fetch api (no resume, no download throttling, ...)
- none specified: will output the Real-Debrid unrestricted links so they can be piped down (set LOG_LEVEL to silent)