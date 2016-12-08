'use strict'

const path = require('path')
const test = require('tap').test
require('../lib/logger')(require('./logger'))
const readdir = require('../lib/readdir')
const migratedown = require('../lib/migratedown')

test('runs all migrations successfully', (t) => {
  t.plan(1)
  function query (sql, cb) {
    if (sql.indexOf('if not exists') > -1) return cb(undefined, undefined)
    if (sql.indexOf('from cloob_migrations') > -1) {
      return cb(undefined, {
        rows: [{current: '2016.12.07-2'}]
      })
    }
    return cb(undefined, undefined)
  }
  readdir(path.join(__dirname, 'fixtures', 'migratedown', 'one'), (err, migrations) => {
    if (err) return t.threw(err)
    const down = migratedown(query)
    down(migrations)
      .then((applied) => {
        t.is(applied.length, 2)
      })
      .catch((err) => t.threw(err))
  })
})

test('bombs if a direction is missing', (t) => {
  t.plan(1)
  function query (sql, cb) {
    if (sql.indexOf('if not exists') > -1) return cb(undefined, undefined)
    if (sql.indexOf('from cloob_migrations') > -1) {
      return cb(undefined, {
        rows: [{current: '2016.12.07-2'}]
      })
    }
    return cb(undefined, undefined)
  }
  readdir(path.join(__dirname, 'fixtures', 'migratedown', 'two'), (err, migrations) => {
    if (err) return t.threw(err)
    const down = migratedown(query)
    down(migrations)
      .then((applied) => t.fail('should not have succeeded'))
      .catch((err) => t.is(err.message.indexOf('2016.12.07-2') > -1, true))
  })
})

test('starts at current migration', (t) => {
  t.plan(4)
  function query (sql, cb) {
    if (sql.indexOf('if not exists') > -1) return cb(undefined, undefined)
    if (sql.indexOf('from cloob_migrations') > -1) {
      return cb(undefined, {
        rows: [{current: '2016.12.07-2'}]
      })
    }
    cb(undefined, undefined)
  }
  readdir(path.join(__dirname, 'fixtures', 'migratedown', 'three'), (err, migrations) => {
    if (err) return t.threw(err)
    const down = migratedown(query)
    down(migrations)
      .then((applied) => {
        t.is(applied.length, 2)
        t.is(applied.indexOf('2016.12.07-3'), -1)
        t.is(applied.indexOf('2016.12.07-2'), 0)
        t.is(applied.indexOf('2016.12.07-1'), 1)
      })
      .catch((err) => t.threw(err))
  })
})

test('skips empty database', (t) => {
  t.plan(1)
  function query (sql, cb) {
    if (sql.indexOf('if not exists') > -1) return cb(undefined, undefined)
    if (sql.indexOf('from cloob_migrations') > -1) {
      return cb(undefined, {
        rows: [{current: undefined}]
      })
    }
    return cb(undefined, undefined)
  }
  readdir(path.join(__dirname, 'fixtures', 'migratedown', 'three'), (err, migrations) => {
    if (err) return t.threw(err)
    const down = migratedown(query)
    down(migrations)
      .then((applied) => {
        t.is(applied.length, 0)
      })
      .catch((err) => t.threw(err))
  })
})

test('stops at specified migration', (t) => {
  t.plan(4)
  function query (sql, cb) {
    if (sql.indexOf('if not exists') > -1) return cb(undefined, undefined)
    if (sql.indexOf('from cloob_migrations') > -1) {
      return cb(undefined, {
        rows: [{current: '2016.12.07-3'}]
      })
    }
    return cb(undefined, undefined)
  }
  readdir(path.join(__dirname, 'fixtures', 'migratedown', 'three'), (err, migrations) => {
    if (err) return t.threw(err)
    const down = migratedown(query)
    down(migrations, '2016.12.07-2')
      .then((applied) => {
        t.is(applied.length, 2)
        t.is(applied.indexOf('2016.12.07-3'), 0)
        t.is(applied.indexOf('2016.12.07-2'), 1)
        t.is(applied.indexOf('2016.12.07-1'), -1)
      })
      .catch((err) => t.threw(err))
  })
})
