# routewatch

Lightweight dev proxy that logs and replays HTTP requests for local API debugging.

## Installation

```bash
npm install -g routewatch
```

## Usage

Start the proxy by pointing it at your target API:

```bash
routewatch --port 3001 --target http://localhost:8080
```

All requests passing through `http://localhost:3001` will be logged and can be replayed on demand.

### Programmatic usage

```typescript
import { createProxy } from 'routewatch';

const proxy = createProxy({
  port: 3001,
  target: 'http://localhost:8080',
  logFile: './requests.log',
});

proxy.start();

// Replay the last captured request
proxy.replay('req_abc123');
```

### Replay from log

```bash
routewatch replay ./requests.log --id req_abc123
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--port` | Port for the proxy to listen on | `3001` |
| `--target` | Target API base URL | required |
| `--logFile` | Path to write request logs | `./routewatch.log` |
| `--silent` | Suppress console output | `false` |

## License

MIT