'use strict'

const Promise = require('./promise')
const log = require(require.resolve('./logger'))()
const queryWrapper = require('./queryWrapper')

module.exports = function (query, old, current, cb) {
  function * updateMigrationsTable () {
    log.trace('updating migrations table value from `%s` to `%s`', old, current)
    try {
      if (current === undefined) return yield queryWrapper(query, 'delete from cloob_migrations')
      if (!old) return yield queryWrapper(query, `insert into cloob_migrations (current) values('${current}')`)
      return yield queryWrapper(query, `update cloob_migrations set current = '${current}'`)
    } catch (err) {
      log.error('could not update migrations table: %s', err.message)
      log.debug(err.stack)
      throw err
    }
  }

  return Promise.coroutine(updateMigrationsTable)
}
