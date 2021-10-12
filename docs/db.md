# Database usage

`wasp-reading-service` is backed by a PostgreSQL database and is the canonical record of the readings recorded in a `WASP` instance.

## Database migrations

Database migrations are handled using [`knex.js`](https://knexjs.org/) and can be migrated manually using the following commands:

```sh
npx knex migrate:latest # used to migrate to latest database version
npx knex migrate:up # used to migrate to the next database version
npx knex migrate:down # used to migrate to the previous database version
```

## Table structure

The following tables exist in the `readings` database.

### `datasets`

`datasets` represent the set time series data streams associated with a `thing`. A `dataset` is then characterised by the `thing` it is for as well as a `type` (such as temperature) and an arbitrary string label `label`. Additionally `metadata` can be set for the `dataset` to describe things such as the `unit` the dataset is measured in.

#### Columns

| column          | PostgreSQL type           | nullable |       default        | description                                                                                      |
| :-------------- | :------------------------ | :------- | :------------------: | :----------------------------------------------------------------------------------------------- |
| `id`            | `UUID`                    | FALSE    | `uuid_generate_v4()` | Unique identifier for the `dataset`                                                              |
| `thing_id`      | `UUID`                    | FALSE    |          -           | Identifier for the `thing` this dataset is associated with                                       |
| `type`          | `CHARACTER VARYING (50)`  | FALSE    |          -           | Type of metric the dataset measures (e.g. temperature)                                           |
| `label`         | `CHARACTER VARYING (50)`  | FALSE    |          -           | A label for the dataset to distinguish multiple datasets for the same type from a single `thing` |
| `unit`          | `CHARACTER VARYING (50)`  | FALSE    |          ``          | Unit of the dataset to identify the unit of the reading value                                    |
| `metadata`      | `CHARACTER VARYING (50)`  | FALSE    |     `{}::jsonb`      | Metadata for the dataset                                                                         |
| `created_at`    | `Timestamp with timezone` | FALSE    |       `now()`        | When the row was first created                                                                   |
| `updated_at`    | `Timestamp with timezone` | FALSE    |       `now()`        | When the row was last updated                                                                    |
| `reading_count` | `integer`                 | FALSE    |          0           | Count of readings for this dataset, maintained here to speed up queries                          |

#### Indexes

| columns                     | Index Type | description                                                                          |
| :-------------------------- | :--------- | :----------------------------------------------------------------------------------- |
| `id`                        | PRIMARY    | Primary key                                                                          |
| `thing_id`, `type`, `label` | Unique     | Prevents more than one `dataset` from being created with identical characterisations |

### `readings`

Stores the individual reading data points within a `dataset`.

#### Columns

| column       | PostgreSQL type           | nullable |      default       | description                    |
| :----------- | :------------------------ | :------: | :----------------: | :----------------------------- |
| `dataset_id` | `UUID`                    |  FALSE   |`uuid_generate_v4()`| Identifier the reading is for  |
| `timestamp`  | `Timestamp with timezone` |  FALSE   |         -          | Timestamp for the reading      |
| `value`      | `Float`                   |  FALSE   |         -          | Value of the reading           |
| `created_at` | `Timestamp with timezone` |  FALSE   |      `now()`       | When the row was first created |
| `updated_at` | `Timestamp with timezone` |  FALSE   |      `now()`       | When the row was last updated  |

#### Indexes

| columns                   | Index Type | description                                                                   |
| :------------------------ | :--------- | :---------------------------------------------------------------------------- |
| `dataset_id`, `timestamp` | PRIMARY    | Primary key (includes `value` for faster range calculations and aggregations) |

#### Foreign Keys

| columns      | References     | description                       |
| :----------- | :------------- | :-------------------------------- |
| `dataset_id` | `datasets(id)` | Guarantees the `dataset` is valid |
