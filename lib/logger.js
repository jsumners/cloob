'use strict'

var log

module.exports = function getLogger (instance) {
  if (log) return log
  log = instance || require('abstract-logging')
  return log
}
