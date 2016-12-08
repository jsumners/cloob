'use strict'

const log = require(require.resolve('./logger'))()

module.exports = function beginTransaction (query) {
  return new Promise((resolve, reject) => {
    log.trace('starting transaction')
    query('begin', (err) => {
      if (err) {
        log.error('could not start transaction: %s', err.message)
        log.debug(err.stack)
        return reject(err)
      }
      log.trace('transaction started')
      resolve(true)
    })
  })
}
