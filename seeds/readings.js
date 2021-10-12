const moment = require('moment')
const { client } = require('../app/db')

// 1 days worth of 5 second data points = 17280
const readingsTotal = 17280 * 1

function createReading({ datasetId, timestamp, value }) {
  return {
    dataset_id: datasetId,
    timestamp,
    value,
  }
}

const cleanup = async () => {
  await client('datasets').del()
  await client('readings').del()
}

const seed = async () => {
  await cleanup()

  const thingOneId = '283d818a-e115-4b88-b264-bb2033de21f8'
  const typeOne = 'active_power_total'
  const labels = ['Schneider5111-id1', 'Schneider5111-id2', 'Schneider5111-id3']
  const unit = 'test-unit'

  const readingTimestamp = moment('2021-03-23 00:00:00', 'YYYY-MM-DD hh:mm:ss')

  // create datasets
  const [{ id: datasetOneId }, { id: datasetTwoId }, { id: datasetThreeId }] = await client('datasets')
    .insert([
      {
        thing_id: thingOneId,
        type: typeOne,
        label: `${labels[0]}`,
        unit,
      },
      {
        thing_id: thingOneId,
        type: typeOne,
        label: `${labels[1]}`,
        unit,
      },
      {
        thing_id: thingOneId,
        type: typeOne,
        label: `${labels[2]}`,
        unit,
      },
    ])
    .returning('*')

  for (let readingsCounter = 0; readingsCounter < readingsTotal; readingsCounter++) {
    const datasetReadingsOne = []

    const readingOne = createReading({
      datasetId: datasetOneId,
      timestamp: readingTimestamp.toISOString(),
      value: Math.sin(readingsCounter / 10) * 100,
    })

    datasetReadingsOne.push(readingOne)

    const readingTwo = createReading({
      datasetId: datasetTwoId,
      timestamp: readingTimestamp.toISOString(),
      value: Math.sin(readingsCounter / 10) * 100,
    })
    datasetReadingsOne.push(readingTwo)

    const readingThree = createReading({
      datasetId: datasetThreeId,
      timestamp: readingTimestamp.toISOString(),
      value: Math.sin(readingsCounter / 10) * 100,
    })
    datasetReadingsOne.push(readingThree)

    await client('readings').insert(datasetReadingsOne)

    readingTimestamp.add('5', 'seconds')
  }
}

module.exports = {
  cleanup,
  seed,
}
