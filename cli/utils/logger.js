// logging utils

const chalk = require('chalk');

const logger = {
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  debug: (...args) => {
    if (process.env.DEBUG) {
      console.log(chalk.gray('[DEBUG]'), ...args);
    }
  }
};

module.exports = { logger };

