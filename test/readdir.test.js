'use strict'

const path = require('path')
const test = require('tap').test
const readdir = require('../lib/readdir')

test('parses fully formed file names', (t) => {
  t.plan(7)
  readdir(path.join(__dirname, 'fixtures', 'migrate'), (err, migrations) => {
    t.is(err, undefined)
    t.is(typeof migrations, 'object')
    t.is(migrations.hasOwnProperty('2016.12.06-1'), true)
    t.is(migrations['2016.12.06-1'].hasOwnProperty('up'), true)
    t.is(migrations['2016.12.06-1'].hasOwnProperty('down'), true)
    t.is(Object.keys(migrations).length, 2)
    t.is(migrations.hasOwnProperty('2016.12.06-2'), true)
  })
})
