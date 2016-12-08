'use strict'

const log = require(require.resolve('./logger'))()

module.exports = function rollbackTransaction (query, cb) {
  return new Promise((resolve, reject) => {
    log.trace('rolling back transaction')
    query('rollback', (err) => {
      if (err) {
        log.error('could not rollback transaction: %s', err.message)
        log.debug(err.stack)
        return reject(err)
      }
      log.trace('transaction rolled back')
      resolve(true)
    })
  })
}
