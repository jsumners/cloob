'use strict'

const Promise = require('./promise')
const log = require(require.resolve('./logger'))()
const queryWrapper = require('./queryWrapper')

module.exports = function (query) {
  function * createMigrationsTable () {
    log.trace('verifying or creating migrations table')
    try {
      yield queryWrapper(query, 'create table if not exists cloob_migrations (current varchar(255))')
    } catch (err) {
      log.error('could not verify or create migrations table: %s', err.message)
      log.debug(err.stack)
      throw err
    }
    log.trace('migrations table verified or created')
    return true
  }

  return Promise.coroutine(createMigrationsTable)
}
