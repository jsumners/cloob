'use strict'

const fs = require('fs')
const path = require('path')
const log = require(require.resolve('./logger'))()
const freg = /(\d{4}\.\d{2}\.\d{2})(?:(\+)(\d+))?-(up|down)(?:-[A-Za-z0-9]+)?.sql/

module.exports = function readdir (dirPath, cb) {
  const _dirPath = path.resolve(dirPath)
  log.trace('loading migrations directory: %s', _dirPath)
  fs.stat(_dirPath, (err, stats) => {
    if (err) {
      log.error('could not stat migrations directory: %s', err.message)
      log.debug(err.stack)
      return cb(err)
    }

    if (stats.isDirectory() === false) return cb(new Error('migrations path must be a directory'))

    fs.readdir(_dirPath, (err, files) => {
      if (err) {
        log.error('could not read migrations directory: %s', err.message)
        log.debug(err.stack)
        return cb(err)
      }

      const migrations = {}
      files
        .forEach((f) => {
          const matches = freg.exec(f)
          if (matches === null) return
          const date = matches[1]
          const num = (matches[2] === '+') ? parseInt(matches[3], 10) : undefined
          const direction = (matches[2] === '+') ? matches[4] : matches[2]
          const key = (num) ? `${date}-${num}` : date
          if (migrations.hasOwnProperty(key)) {
            migrations[key][direction] = path.join(_dirPath, matches[0])
          } else {
            migrations[key] = Object.defineProperty({}, direction, {
              value: path.join(_dirPath, matches[0]),
              enumerable: true
            })
          }
        })

      log.trace('migrations: %j', migrations)
      cb(undefined, migrations)
    })
  })
}
