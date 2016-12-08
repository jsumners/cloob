'use strict'

const fs = require('fs')
const Promise = require('./promise')
const log = require(require.resolve('./logger'))()
const queryWrapper = require('./queryWrapper')
const createMigrationsTable = require('./createMigrationsTable')
const updateMigrationsTable = require('./updateMigrationsTable')
const beginTransaction = require('./beginTransaction')
const endTransaction = require('./endTransaction')
const rollbackTransaction = require('./rollbackTransaction')

module.exports = function migrateupWrapper (query) {
  function * migrateup (migrations, stopAt) {
    const keys = Object.keys(migrations)

    log.trace('preparing upward migrations')
    yield beginTransaction(query)
    yield createMigrationsTable(query)()

    var result
    try {
      result = yield queryWrapper(query, 'select current from cloob_migrations')
    } catch (err) {
      log.error('could not determine current database level: %s', err.message)
      log.debug(err.stack)
      yield rollbackTransaction(query)
      throw err
    }

    const current = (result.rows.length === 1) ? result.rows[0].current : undefined
    log.trace('current database level: %s', current || 'none')

    const start = (current === undefined) ? 0 : keys.indexOf(current) + 1
    if (start > keys.length) {
      log.trace('all migrations already applied, skipping')
      yield endTransaction(query)
      return []
    }
    log.trace('starting migration at key index: %s', start)

    const end = (!stopAt) ? keys.length : (function () {
      const pos = keys.indexOf(stopAt)
      if (pos === -1) return keys.length
      return pos + 1
    }())
    log.trace('ending migration at key index: %s', end)

    log.trace('starting migrations')
    const migrationsApplied = []
    for (var i = start; i < end; i += 1) {
      log.trace('performing migration: %s', keys[i])
      const migration = migrations[keys[i]]
      if (!migration.hasOwnProperty('up') || !migration.hasOwnProperty('down')) {
        yield rollbackTransaction(query)
        throw new Error(`migration ${keys[i]} is missing a direction (up or down)`)
      }

      try {
        const sql = fs.readFileSync(migration.up)
        yield queryWrapper(query, sql.toString())
        migrationsApplied.push(keys[i])
      } catch (err) {
        log.error('could not complete migration `%s`: %s', keys[i], err.message)
        log.debug(err.stack)
        yield rollbackTransaction(query)
        throw err
      }
    }

    if (migrationsApplied.length > 0) {
      try {
        yield updateMigrationsTable(query, current, migrationsApplied[migrationsApplied.length - 1])()
      } catch (err) {
        yield rollbackTransaction(query)
        throw err
      }
    } else {
      log.trace('no migrations applied so not updating database level')
    }

    yield endTransaction(query)
    return migrationsApplied
  }

  return Promise.coroutine(migrateup)
}
