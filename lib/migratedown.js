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

module.exports = function migratedownWrapper (query) {
  function * migratedown (migrations, stopAt) {
    const keys = Object.keys(migrations)

    log.trace('preparing downward migrations')
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
    if (current === undefined) {
      log.trace('database empty, not running migrations')
      yield endTransaction(query)
      return []
    }

    const start = (current === undefined) ? keys.length - 1 : keys.indexOf(current)
    log.trace('starting migration at key index: %s', start)

    const end = (!stopAt) ? 0 : (function () {
      const pos = keys.indexOf(stopAt)
      return Math.max(pos, 0)
    }())
    log.trace('ending migration at key index: %s', end)

    log.trace('starting migrations')
    const migrationsApplied = []

    for (var i = start; i >= end; i -= 1) {
      log.trace('performing migration: %s', keys[i])
      const migration = migrations[keys[i]]
      if (!migration.hasOwnProperty('up') || !migration.hasOwnProperty('down')) {
        yield rollbackTransaction(query)
        throw new Error(`migration ${keys[i]} is missing a direction (up or down)`)
      }

      try {
        const sql = fs.readFileSync(migration.down)
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
        const lastApplied = migrationsApplied[migrationsApplied.length - 1]
        yield updateMigrationsTable(
          query, current, (keys.indexOf(lastApplied) === 0) ? undefined : lastApplied
        )()
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

  return Promise.coroutine(migratedown)
}
