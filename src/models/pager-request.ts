/**
 * Represents the paging parameters for Real-Debrid list requests
 */
export interface PagerRequest {
  /** Starting offset (must be within 0 and X-Total-Count HTTP header) */
  offset: number;
  /** Pagination system, You can not use both offset and page at the same time, page is prioritzed in case it happens. */
  page: number;
  /** Entries returned per page / request (must be within 0 and 2500, default: 50) */
  limit: number;
  /** "active", list active torrents first */
  filter: 'active' | undefined;
}
