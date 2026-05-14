import { describe, it, expect } from 'bun:test';
import { parseAlertArgs, printAlertUsage } from './alert-cli';

describe('parseAlertArgs', () => {
  it('parses log file positional argument', () => {
    const args = parseAlertArgs(['requests.log']);
    expect(args.logFile).toBe('requests.log');
  });

  it('parses --severity flag', () => {
    const args = parseAlertArgs(['requests.log', '--severity', 'error']);
    expect(args.severity).toBe('error');
  });

  it('parses single --rule flag', () => {
    const args = parseAlertArgs(['requests.log', '--rule', 'server-error']);
    expect(args.rules).toEqual(['server-error']);
  });

  it('parses multiple --rule flags', () => {
    const args = parseAlertArgs([
      'requests.log',
      '--rule',
      'server-error',
      '--rule',
      'slow-response',
    ]);
    expect(args.rules).toEqual(['server-error', 'slow-response']);
  });

  it('returns empty logFile when no positional given', () => {
    const args = parseAlertArgs(['--severity', 'warn']);
    expect(args.logFile).toBe('');
  });

  it('ignores unknown flags gracefully', () => {
    const args = parseAlertArgs(['file.log', '--unknown']);
    expect(args.logFile).toBe('file.log');
  });

  it('returns empty rules array when no --rule flags provided', () => {
    const args = parseAlertArgs(['requests.log', '--severity', 'warn']);
    expect(args.rules).toEqual([]);
  });

  it('returns undefined severity when --severity flag is not provided', () => {
    const args = parseAlertArgs(['requests.log']);
    expect(args.severity).toBeUndefined();
  });
});

describe('printAlertUsage', () => {
  it('runs without throwing', () => {
    expect(() => printAlertUsage()).not.toThrow();
  });
});
