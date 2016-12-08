'use strict'

const test = require('tap').test
require('../lib/logger')(require('./logger'))
const beginTransaction = require('../lib/beginTransaction')

test('sucessfully starts transaction', (t) => {
  t.plan(1)
  function query (sql, cb) {
    if (sql.indexOf('begin') > -1) return cb(undefined, {rows: []})
    cb(new Error('should not happen'))
  }
  beginTransaction(query)
    .then((result) => {
      t.is(result, true)
    })
})

test('rejects for failure', (t) => {
  t.plan(1)
  function query (sql, cb) {
    cb(new Error('failed'))
  }
  beginTransaction(query)
    .catch((err) => {
      t.is(err.message, 'failed')
    })
})
