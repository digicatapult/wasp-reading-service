# wasp-reading-service

## Deprecation Notice
`WASP` was deprecated on March 14th 2024, there will be no further dependency or security updates to this platform.
---

Reading service for `WASP`. Handles the storage and retrieval of readings and datasets.

## Getting started

`wasp-reading-service` can be run in a similar way to most nodejs application. First install required dependencies using `npm`:

```sh
npm install
```

`wasp-reading-service` depends on a `postgresql` database dependency and `Kafka` which can be brought locally up using docker:

```sh
docker-compose up -d
```

Finally the database must be initialised with:

```sh
npx knex migrate:latest
```

And finally you can run the application in development mode with:

```sh
npm run dev
```

Or run tests with:

```sh
npm test
```

## Environment Variables

`wasp-reading-service` is configured primarily using environment variables as follows:

| variable                           | required |         default         | description                                                                                          |
| :--------------------------------- | :------: | :---------------------: | :--------------------------------------------------------------------------------------------------- |
| LOG_LEVEL                          |    N     |         `info`          | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`]                 |
| PORT                               |    N     |          `80`           | Port on which the service will listen                                                                |
| DB_HOST                            |    Y     |            -            | Hostname for the db                                                                                  |
| DB_PORT                            |    N     |          5432           | Port to connect to the db                                                                            |
| DB_NAME                            |    N     |       `readings`        | Name of the database to connect to                                                                   |
| DB_USERNAME                        |    Y     |            -            | Username to connect to the database with                                                             |
| DB_PASSWORD                        |    Y     |            -            | Password to connect to the database with                                                             |
| API_VERSION                        |    N     | `package.json version`  | Official API version                                                                                 |
| API_OFFSET_LIMIT                   |    N     |          1000           | API offset limit version                                                                             |
| KAFKA_LOG_LEVEL                    |    N     |        `nothing`        | Log level to use for the Kafka connection. Choices are 'debug', 'info', 'warn', 'error' or 'nothing' |
| KAFKA_BROKERS                      |    Y     |    `localhost:9092`     | Comma separated List of Kafka brokers to connect to                                                  |
| KAFKA_READINGS_TOPIC               |    Y     |       `readings`        | Topic to listen for new reading on                                                                   |
| KAFKA_READINGS_NOTIFICATIONS_TOPIC |    Y     | `reading-notifications` | Topic to push new readings to for websocket service on                                               |

## Database structure

The structure of the database backing `wasp-reading-service` can be found in [docs/db.md](./docs/db.md)
