import knex from 'knex'
import env from './env.js'

const client = knex({
  client: 'pg',
  migrations: {
    tableName: 'migrations',
  },
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  },
})

const assertDataset = async ({ thingId, type, label, unit }) => {
  const [exists] = await client('datasets')
    .select(['id', 'created_at', 'updated_at'])
    .where({ thing_id: thingId, type, label, unit })

  if (exists) {
    const { id, created_at: createdAt, updated_at: updatedAt } = exists
    return { id, thingId, type, label, unit, updatedAt, createdAt }
  }

  const [{ id, created_at: createdAt, updated_at: updatedAt }] = await client('datasets')
    .insert({ thing_id: thingId, type, label, unit })
    .onConflict(['thing_id', 'type', 'label'])
    .merge({ updated_at: new Date().toISOString(), unit })
    .returning(['id', 'created_at', 'updated_at'])

  return { id, thingId, type, label, unit, updatedAt, createdAt }
}

const addReading = async ({ dataset, timestamp, value }) => {
  await client.transaction(async (tx) => {
    await tx('readings').insert({ dataset_id: dataset.id, timestamp, value })
    await tx('datasets').increment('reading_count', 1).where({ id: dataset.id }) // maintained for quicker queries
  })
}

const findDatasetByThingIdAndId = async ({ thingId, id }) => {
  return client('datasets AS d')
    .select(['d.id AS id', 'd.type AS type', 'd.thing_id AS thingId', 'd.label AS label', 'd.unit AS unit'])
    .where({ thing_id: thingId, id })
}

const findDatasetsByThingId = async ({ thingId }) => {
  return client('datasets AS d')
    .select(['d.id AS id', 'd.type AS type', 'd.thing_id AS thingId', 'd.label AS label', 'd.unit AS unit'])
    .where({ thing_id: thingId })
}

const updateDataset = async ({ thingId, id, type, label, unit }) => {
  return client('datasets')
    .update({ type, label, unit })
    .returning(['id', 'thing_id AS thingId', 'type', 'label', 'unit'])
    .where({ thing_id: thingId, id })
}

const deleteDataset = ({ thingId, id }) => {
  return client('datasets').del().where({ thing_id: thingId, id })
}

const getReadings = ({ id, offset, limit, sortByTimestamp, startDate, endDate }) => {
  let query = client('readings')
    .select(['timestamp', 'value'])
    .where({ dataset_id: id })
    .orderBy('timestamp', sortByTimestamp)
    .limit(limit)

  if (Number.isFinite(offset)) {
    query = query.offset(offset)
  }

  if (startDate) {
    query = query.where('timestamp', '>=', startDate)
  }
  if (endDate) {
    query = query.where('timestamp', '<=', endDate)
  }

  return query
}

const getReadingsCount = ({ id, startDate, endDate }) => {
  if (!startDate && !endDate) {
    return client('datasets').select('reading_count').where({ id })
  }

  let query = client('readings').count('*', { as: 'reading_count' }).where({ dataset_id: id })

  if (startDate) {
    query = query.where('timestamp', '>=', startDate)
  }
  if (endDate) {
    query = query.where('timestamp', '<=', endDate)
  }

  return query
}

export {
  client,
  assertDataset,
  addReading,
  findDatasetByThingIdAndId,
  findDatasetsByThingId,
  updateDataset,
  deleteDataset,
  getReadings,
  getReadingsCount,
}
