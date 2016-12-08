'use strict'

const test = require('tap').test
require('../lib/logger')(require('./logger'))
const endTransaction = require('../lib/endTransaction')

test('sucessfully starts transaction', (t) => {
  t.plan(1)
  function query (sql, cb) {
    if (sql.indexOf('commit') > -1) return cb(undefined, {rows: []})
    cb(new Error('should not happen'))
  }
  endTransaction(query)
    .then((result) => {
      t.is(result, true)
    })
})

test('rejects for failure', (t) => {
  t.plan(1)
  function query (sql, cb) {
    cb(new Error('failed'))
  }
  endTransaction(query)
    .catch((err) => {
      t.is(err.message, 'failed')
    })
})
