'use strict'

const test = require('tap').test
require('../lib/logger')(require('./logger'))
const updateMigrationsTable = require('../lib/updateMigrationsTable')

test('inserts value into new table', (t) => {
  t.plan(1)
  function query (sql, cb) {
    if (sql.startsWith('insert int')) return cb(undefined, {rows: []})
    return cb(new Error('should not happen'))
  }
  updateMigrationsTable(query, undefined, '2016.12.08-1')()
    .then((result) => t.is(Array.isArray(result.rows), true))
})

test('drops rows for empty schema', (t) => {
  t.plan(1)
  function query (sql, cb) {
    if (sql.startsWith('delete from')) return cb(undefined, {rows: []})
    return cb(new Error('should not happen'))
  }
  updateMigrationsTable(query, '2016.12.08-1', undefined)()
    .then((result) => t.is(Array.isArray(result.rows), true))
})

test('sets new value', (t) => {
  t.plan(1)
  function query (sql, cb) {
    if (sql.indexOf(`set current = '`) > -1) return cb(undefined, {rows: []})
    return cb(new Error('should not happen'))
  }
  updateMigrationsTable(query, '2016.12.08-1', '2016.12.08-2')()
    .then((result) => t.is(Array.isArray(result.rows), true))
})
