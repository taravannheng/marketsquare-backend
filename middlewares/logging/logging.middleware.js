const morgan = require('morgan');

const loggingMiddleWare = morgan('combined');

module.exports = loggingMiddleWare;