'use strict'

const log = require(require.resolve('./logger'))()

module.exports = function endTransaction (query, cb) {
  return new Promise((resolve, reject) => {
    log.trace('ending transaction')
    query('commit', (err) => {
      if (err) {
        log.error('could not end transaction: %s', err.message)
        log.debug(err.stack)
        return reject(err)
      }
      log.trace('transaction ended')
      resolve(true)
    })
  })
}
