export type LogTone = 'neutral' | 'profit' | 'loss' | 'danger' | 'milestone';

export interface LogEntry {
  id: number;
  message: string;
  tone: LogTone;
  timestamp: number;
}

let nextId = 1;

export function createLogEntry(message: string, tone: LogTone = 'neutral'): LogEntry {
  return { id: nextId++, message, timestamp: Date.now(), tone };
}

export function pushLog(log: LogEntry[], entry: LogEntry, max = 40): LogEntry[] {
  return [entry, ...log].slice(0, max);
}