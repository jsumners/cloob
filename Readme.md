# cloob

*cloob* is a simple database migration tool and API. It merely executes a well
ordered set of standard SQL scripts. It targets the PostgreSQL database server,
but any database is possible given the right [query](#api) method.

All operations are performed within a [transaction][transaction]. If there is
and error at any point during the migration process then the transaction will
be [rolled back][rollback]. Once the migrations have been applied, and the
status table (`cloob_migrations`) has been updated, the transaction will
be [committed][commit].

If you need to use transactions within your migration scripts you should
use [savepoints][savepoint].

[transaction]: https://www.postgresql.org/docs/9.1/static/sql-begin.html
[rollback]: https://www.postgresql.org/docs/9.1/static/sql-rollback.html
[commit]: https://www.postgresql.org/docs/9.1/static/sql-commit.html
[savepoint]: https://www.postgresql.org/docs/9.1/static/sql-savepoint.html

<a id="dirStructure"></a>
## Migrations Directory

A migrations directory consists of a set of SQL scripts, i.e. "migration files".
Migration file names must match the format `YYYY.MM.DD<+nnn>-(up|down)<-[A-Za-z0-9]>.sql`:

+ `YYYY.MM.DD`: required date stamp
+ `<+nnn>`: optional sequential ordering number to differentiate multiple migrations
  created on the same day
+ `-(up|down)`: required migration direction indicator
+ `<-[A-Za-z0-9]>`: optional descriptive tag (not used by *cloob*, it's merely
  for the user's benefit when viewing the directory)

For example, the following are all valid:

+ `2016.12.06-up.sql` and `2016.12.06-down.sql`
+ `2016.12.06+1-up.sql` and `2016.12.06+1-down.sql`
+ `2016.12.06+002-up.sql` and `2016.12.06+02-down.sql`
+ `2016.12.06+3-up-foobar.sql` and `2016.12.06+3-down-foobar.sql`

Assuming a migrations directory contains all files in the above examples, the
directory would be parsed into the object:

```js
{
  '2016.12.06': {
    up: '/path/to/2016.12.06-up.sql',
    down: '/path/to/2016.12.06-down.sql'
  },
  '2016.12.06-1': {
    up: '/path/to/2016.12.06+1-up.sql',
    down: '/path/to/2016.12.06+1-down.sql'
  },
  '2016.12.06-2': {
    up: '/path/to/2016.12.06+002-up.sql',
    down: '/path/to/2016.12.06+02-down.sql'
  },
  '2016.12.06-3': {
    up: '/path/to/2016.12.06+3-up-foobar.sql',
    down: '/path/to/2016.12.06+3-down-foobar.sql'
  }
}
```

Notice that `002` is equivalent to `02` is equivalent to `2`. This object will
then be iterated to apply the migrations, starting from the first migration
that has not been applied for `up` migrations. For `down` migrations the
procedure will start with the most recently applied.

There **must** be a corresponding `down` file for every `up` file. If a migration
is missing a direction then the migration procedure will not be executed.

<a id="cli"></a>
## CLI

*cloob* provides a command line interface. The options are:

+ `--config <file>` (`-c`): JSON or JS config file that exports a [pg][pg]
  connection configuration object.
+ `--direction <up|down>` (`-d`): the migration direction to apply.
  Default: `up`.
+ `--debug` (`-D`): enable verbose logging
+ `--end <id>` (`-e`): migration identifier to stop with
+ `--migrations <path>` (`m`): location of the migrations directory to
  apply. Default: `./migrations`.

The `config` parameter is required. The most basic config file would be:

```json
{
  "user": "dbuser"
}
```

Or, if you need to connect to a different database than the environment's
user database:

```json
{
  "user": "dbuser",
  "database": "some_other_db"
}
```

And running the migrations:

```
cloob -c ./config.json
```

[pg]: https://www.npmjs.com/package/pg

<a id="api"></a>
## API

```js
const pg = require('pg')
const client = new pg.Client()
client.connect()
const cloob = require('cloob')({
  query: client.query.bind(client),
  logger: require('pino')({level: 'debug'}) // optional `abstract-logging` compliant logger
})

// {
//   loadMigrations (string: directoryPath, function: callback),
//   migrateUp (object: migrations, [string: stopAt]) => Promise(applied, error),
//   migrateDown (object: migrations, [string: stopAt]) => Promise(applied, error)
// }
```

The `query` property is required. It must be a function that has the signature
`query(string, callback)`. The `callback` must have the signature
`callback(err, results)`, where `results`, on a successful `SELECT`, is an
object like:

```js
{
  rows: [
    {colName: 'value'}
  ]
}
```

Logging by *cloob* uses the following guidelines:

+ `trace` is the default level used for general messages
+ `error` is used to log error messages, i.e. `(new Error('foo')).message`
+ `debug` is used to print stack traces associted with errors

Logs will not be printed unless a logger instance is supplied. The default
logger used by *cloob* is a no operation logger.

<a id="loadMigrations"></a>
### loadMigrations

+ `directoryPath` (string): path to a directory containing migration files
+ `callback` (function): will be invoked after the migrations have loaded. The
  callback has an `error` parameter and a `migrations` parameter

This method must be invoked prior to `migrateUp` or `migrateDown`. It reads a
specified migrations directory, builds a migrations object (as described in
[Migrations Directory](#dirStructure)), and returns the object.

```js
cloob.loadMigrations('/some/migrations/dir', (err, migrations) => {
  if (err) throw err
  console.log(migrations)
})
```

<a id="migrateUp"></a>
### migrateUp

This method is used to apply a set of migrations in the forward direction, e.g.
from nothing to complete.

+ `migrations` (object): a migrations object as returned by [loadMigrations](#loadMigrations)
+ `stopAt` (string) [optional]: a migration identifier, e.g. `2016.12.07-2`, to
  stop the migrations with. The named migration will be included
+ returns `Promise`: resolution includes an `applied` parameter that will
  be an array of migration identifiers that were applied, e.g. `['2016.12.07-1', '2016.12.07-2']`

```js
cloob.migrateUp(migrations)
  .then((applied) => console.log(`${applied.length} migrations were applied`))
  .catch((err) => console.error(err.message))
```

<a id="migrateDown"></a>
### migrateDown

This method is used to apply a set of migrations in the reverse direction, e.g.
from complete to nothing.

+ `migrations` (object): a migrations object as returned by [loadMigrations](#loadMigrations)
+ `stopAt` (string) [optional]: a migration identifier, e.g. `2016.12.07-2`, to
  stop the migrations with. The named migration will be included
+ returns `Promise`: resolution includes an `applied` parameter that will
  be an array of migration identifiers that were applied, e.g. `['2016.12.07-2', '2016.12.07-1']`

```js
cloob.migrateDown(migrations)
  .then((applied) => console.log(`${applied.length} migrations were reversed`)
  .catch((err) => console.error(err.message))
})
```

## License

[MIT License](http://jsumners.mit-license.org/)
