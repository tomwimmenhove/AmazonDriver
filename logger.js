const cleanDeep = require('clean-deep');

const LogLevels = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LogLevels[process.env.LOG_LEVEL || 'info'];

function createLogEntry(level, message, context) {
  if (context instanceof Error) {
    return cleanDeep({
      time: new Date().toISOString(),
      level,
      message,
      exceptionName: context.name,
      exceptionMessage: context.message,
      exceptionStack: context.stack,
    });
  }

  return cleanDeep({
    time: new Date().toISOString(),
    level,
    message,
    ...context
  });
}

function log(level, message, context = {}) {
  if (LogLevels[level] < currentLevel) {
    return;
  }

  const logEntry = createLogEntry(level, message, context);

  process.stdout.write(JSON.stringify(logEntry) + '\n');
}

const debug = (msg, ctx) => log('debug', msg, ctx);
const info  = (msg, ctx) => log('info',  msg, ctx);
const warn  = (msg, ctx) => log('warn',  msg, ctx);
const error = (msg, ctx) => log('error', msg, ctx);

module.exports = { log, debug, info, warn, error };

