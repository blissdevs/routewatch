# Alert

The `alert` module scans log entries and fires notifications when entries match
predefined or custom rules.

## Built-in Rules

| Rule | Severity | Condition |
|------|----------|-----------|
| `server-error` | error | Response status ≥ 500 |
| `slow-response` | warn | Duration > 2000 ms |
| `client-error` | warn | Response status 400–499 |
| `large-response` | info | Response body > 100 KB |

## API

```ts
import { checkAlerts, formatAlerts, printAlerts } from './alert';

const results = checkAlerts(entries);
printAlerts(results);
```

### Custom Rules

```ts
const rule: AlertRule = {
  name: 'no-auth',
  severity: 'warn',
  test: (e) => !e.requestHeaders['authorization'],
  message: (e) => `Missing auth header on ${e.method} ${e.url}`,
};

const results = checkAlerts(entries, [rule]);
```

## CLI

```bash
routewatch alert requests.log
routewatch alert requests.log --severity error
routewatch alert requests.log --rule slow-response --rule server-error
```

### Options

- `--severity <level>` — Filter output to `info`, `warn`, or `error` alerts only.
- `--rule <name>` — Restrict checks to the named rule(s). Can be repeated.
