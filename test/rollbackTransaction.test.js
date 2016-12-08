'use strict'

const test = require('tap').test
require('../lib/logger')(require('./logger'))
const rollbackTransaction = require('../lib/rollbackTransaction')

test('sucessfully starts transaction', (t) => {
  t.plan(1)
  function query (sql, cb) {
    if (sql.indexOf('rollback') > -1) return cb(undefined, {rows: []})
    cb(new Error('should not happen'))
  }
  rollbackTransaction(query)
    .then((result) => {
      t.is(result, true)
    })
})

test('rejects for failure', (t) => {
  t.plan(1)
  function query (sql, cb) {
    cb(new Error('failed'))
  }
  rollbackTransaction(query)
    .catch((err) => {
      t.is(err.message, 'failed')
    })
})
