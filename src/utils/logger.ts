/* Simple pluggable logger abstraction */
type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogRecord {
    level: Level;
    msg: string;
    data?: unknown;
    ts: string;
}

const enabledLevels: Record<Level, boolean> = {
    debug: !!import.meta.env.DEV,
    info: true,
    warn: true,
    error: true
};

function emit(rec: LogRecord) {
    // Replace with Sentry or external logging if desired
    const line = `[${rec.ts}] [${rec.level.toUpperCase()}] ${rec.msg}`;
    if (!enabledLevels[rec.level]) return;
    if (rec.level === 'error') console.error(line, rec.data);
    else if (rec.level === 'warn') console.warn(line, rec.data);
    else if (rec.level === 'debug') console.debug(line, rec.data);
    else console.log(line, rec.data);
}

export const logger = {
    debug: (msg: string, data?: unknown) => emit({ level: 'debug', msg, data, ts: new Date().toISOString() }),
    info: (msg: string, data?: unknown) => emit({ level: 'info', msg, data, ts: new Date().toISOString() }),
    warn: (msg: string, data?: unknown) => emit({ level: 'warn', msg, data, ts: new Date().toISOString() }),
    error: (msg: string, data?: unknown) => emit({ level: 'error', msg, data, ts: new Date().toISOString() })
};