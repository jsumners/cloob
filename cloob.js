'use strict'

module.exports = function (options) {
  if (!options.hasOwnProperty('query') || typeof options.query !== 'function') {
    throw new Error('missing query function')
  }
  const query = options.query

  // initialize logger
  require(require.resolve('./lib/logger'))(options.logger)

  return {
    loadMigrations: require('./lib/readdir.js'),
    migrateUp: require('./lib/migrateup.js')(query),
    migrateDown: require('./lib/migratedown.js')(query)
  }
}
