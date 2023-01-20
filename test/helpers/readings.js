import delay from 'delay'
import env from '../../app/env.js'
import { getProducer } from './kafka.js'

const { KAFKA_READINGS_TOPIC } = env

const getReadings = (context) => context.db('readings')

const getReadingCount = async (context) => {
  const readingCountArr = await context.db('readings').count()
  return parseInt(readingCountArr[0].count)
}

const publishReadingAndWait = async ({ context, thingId, type, label, unit, timestamp, value }) => {
  const initReadingCount = await getReadingCount(context)

  await getProducer().send({
    topic: KAFKA_READINGS_TOPIC,
    messages: [
      {
        key: thingId,
        value: JSON.stringify({
          dataset: {
            thingId,
            type,
            label,
            unit,
          },
          timestamp,
          value,
        }),
      },
    ],
  })

  for (let i = 0; i < 10; i++) {
    const count = await getReadingCount(context)
    if (count - initReadingCount === 1) {
      return
    } else {
      await delay(100)
    }
  }

  throw new Error('Timeout waiting for reading count in db to increase')
}

function createReading({ datasetId, timestamp, value }) {
  return {
    dataset_id: datasetId,
    timestamp: timestamp || new Date().toISOString(),
    value: value,
  }
}

function createReadings({ date, datasetId, total }) {
  const readings = []

  for (let counter = 0; counter < total; counter++) {
    const timestamp = date.add(2, 'minutes').toISOString()
    const reading = createReading({
      datasetId,
      timestamp,
      value: counter,
    })

    readings.push(reading)
  }

  return readings
}

const insertReadings = async ({ context, readings, datasetId }) => {
  await context.db('readings').insert(readings)
  await context.db('datasets').increment('reading_count', readings.length).where({ id: datasetId })
}

const deleteReadings = async ({ context, datasetId }) => {
  const deleted = await context.db('readings').del().where({ dataset_id: datasetId }).returning(1)
  await context.db('datasets').decrement('reading_count', deleted.length).where({ id: datasetId })
}

export { getReadings, publishReadingAndWait, createReadings, insertReadings, deleteReadings }
