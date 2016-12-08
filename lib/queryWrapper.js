'use strict'

const Promise = require('./promise')
module.exports = function (query, sql) {
  return new Promise((resolve, reject) => {
    query(sql, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}
