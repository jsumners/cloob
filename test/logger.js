'use strict'

var logger

if (process.env.DEBUG) {
  const pino = require('pino')
  const pretty = pino.pretty()
  pretty.pipe(process.stdout)
  logger = pino({level: 'trace'}, pretty)
} else {
  logger = require('abstract-logging')
}

module.exports = logger
