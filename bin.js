#!/usr/bin/env node
'use strict'

const path = require('path')

const commander = require('commander')
commander
  .version(require(require.resolve('./package.json')).version)
  .description('A PostgreSQL migration tool.')
  .option('-c, --config <file>', 'A json or js config file with database configuration')
  .option('-d, --direction <up|down>', 'Migration direction to apply (default: up)', 'up')
  .option('-D, --debug', 'Enable printing of debug information')
  .option('-e, --end <id>', 'Migration identifier to stop with (inclusive), e.g. `2016.12.08-5`')
  .option('-m, --migrations <path>', 'Path to migrations directory (default: `./migrations`)', './migrations')
  .parse(process.argv)

commander.on('--help', () => {
  console.log('The `--config` option is required.')
  console.log('Configuration parameters are described at -- https://github.com/brianc/node-postgres/wiki/Client#new-clientobject-config--client')
})

if (!commander.config || !commander.migrations) {
  commander.help()
  process.exit(1)
}

const pino = require('pino')
const pretty = pino.pretty()
pretty.pipe(process.stdout)
var log = (commander.debug) ? pino({level: 'trace'}, pretty) : pino(pretty)

log.trace('loading configuration')
var config
try {
  const fp = path.resolve(commander.config)
  config = require(fp)
} catch (e) {
  log.trace('could not load config: %s', e.message)
  log.debug(e.stack)
  process.exit(1)
}

var client
try {
  const pg = require('pg')
  client = new pg.Client(config)
  client.connect()
} catch (e) {
  log.error('could not establish db connection: %s', e.message)
  log.debug(e.stack)
  process.exit(1)
}

const cloob = require(require.resolve('./cloob.js'))({
  logger: log,
  query: client.query.bind(client)
})

cloob.loadMigrations(path.resolve(commander.migrations), (err, migrations) => {
  if (err) {
    client.end()
    process.exit(1)
  }

  switch (commander.direction.toLowerCase()) {
    default:
    case 'up':
      log.trace('migration direction: up')
      cloob.migrateUp(migrations, commander.end)
        .then((applied) => {
          log.info('applied migrations: %j', applied)
        })
        .catch((err) => {
          log.error('migration failed: %s', err.message)
        })
        .then(() => client.end())
      break
    case 'down':
      log.trace('migration direction: down')
      cloob.migrateDown(migrations, commander.end)
        .then((applied) => {
          log.info('applied migrations: %j', applied)
        })
        .catch((err) => {
          log.error('migration failed: %s', err.message)
        })
        .then(() => client.end())
  }
})
