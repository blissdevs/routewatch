# Score

The `score` module assigns a quality score (0–100) to each logged HTTP entry based on response characteristics.

## How It Works

Each entry starts at 100 points. Points are added or subtracted based on:

| Factor              | Delta |
|---------------------|-------|
| 2xx success         | +15   |
| Fast response <200ms| +10   |
| Small payload <10KB | +5    |
| 5xx server error    | -30   |
| Slow response >2s   | -20   |
| 4xx client error    | -15   |
| Large payload >100KB| -10   |
| Missing Content-Type| -5    |

The final score is clamped between 0 and 100.

## API

```ts
import { scoreEntry, scoreEntries, formatScore, printScores } from "./score";

// Score a single entry
const result = scoreEntry(entry);
console.log(result.score);      // 0–100
console.log(result.breakdown);  // { success: 15, fastResponse: 10, ... }

// Score and sort multiple entries
const results = scoreEntries(entries);

// Format for display
console.log(formatScore(result));

// Print all scores
printScores(results);
```

## Output Example

```
[95/100] GET http://localhost/api/users
  +15  success
  +10  fastResponse
  +5   smallPayload
  -5   missingContentType
```
