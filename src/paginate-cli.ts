export interface PaginateCliArgs {
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export function parsePaginateArgs(argv: string[]): PaginateCliArgs {
  let page = DEFAULT_PAGE;
  let pageSize = DEFAULT_PAGE_SIZE;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === "--page" || arg === "-p") && argv[i + 1]) {
      const val = parseInt(argv[++i], 10);
      if (!isNaN(val) && val > 0) page = val;
    } else if ((arg === "--page-size" || arg === "-n") && argv[i + 1]) {
      const val = parseInt(argv[++i], 10);
      if (!isNaN(val) && val > 0) pageSize = val;
    } else if (arg.startsWith("--page=")) {
      const val = parseInt(arg.split("=")[1], 10);
      if (!isNaN(val) && val > 0) page = val;
    } else if (arg.startsWith("--page-size=")) {
      const val = parseInt(arg.split("=")[1], 10);
      if (!isNaN(val) && val > 0) pageSize = val;
    }
  }

  return { page, pageSize };
}

export function printPaginateUsage(): void {
  console.log(`
Paginate options:
  --page,      -p <n>   Page number to display (default: ${DEFAULT_PAGE})
  --page-size, -n <n>   Entries per page (default: ${DEFAULT_PAGE_SIZE})

Example:
  routewatch logs --page 2 --page-size 10
`.trim());
}
