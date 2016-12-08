'use strict'

const test = require('tap').test
require('../lib/logger')(require('./logger'))
const createMigrationsTable = require('../lib/createMigrationsTable')

test('sucessfully creates table', (t) => {
  t.plan(1)
  function query (sql, cb) {
    if (sql.indexOf('if not exists') > -1) return cb(undefined, {rows: []})
    cb(new Error('should not happen'))
  }
  createMigrationsTable(query)()
    .then((result) => {
      t.is(result, true)
    })
})

test('rejects for failure', (t) => {
  t.plan(1)
  function query (sql, cb) {
    cb(new Error('failed'))
  }
  createMigrationsTable(query)()
    .catch((err) => {
      t.is(err.message, 'failed')
    })
})
