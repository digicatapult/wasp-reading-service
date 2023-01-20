import {
  findDatasetByThingIdAndId,
  findDatasetsByThingId,
  updateDataset,
  deleteDataset,
  getReadings,
  getReadingsCount,
} from '../../db.js'

async function getDatasetByThingIdAndId({ thingId, id }) {
  const result = await findDatasetByThingIdAndId({ thingId, id })

  if (result.length === 0) {
    return { statusCode: 404, result: {} }
  } else {
    return { statusCode: 200, result: result[0] }
  }
}

async function getDatasetsByThingId({ thingId }) {
  const result = await findDatasetsByThingId({ thingId })

  return { statusCode: 200, result }
}

async function putDataset({ thingId, id, type, label, unit }) {
  const resultDataset = await findDatasetByThingIdAndId({ thingId, id })
  if (resultDataset.length === 0) {
    return { statusCode: 404, result: {} }
  } else {
    const updatedDataset = await updateDataset({ thingId, id, type, label, unit })
    const result = updatedDataset.length === 1 ? updatedDataset[0] : {}

    return { statusCode: 200, result }
  }
}

async function removeDataset({ thingId, id }) {
  const resultDataset = await findDatasetByThingIdAndId({ thingId, id })
  if (resultDataset.length === 0) {
    return { statusCode: 404, result: {} }
  } else {
    await deleteDataset({ thingId, id })

    return { statusCode: 204 }
  }
}

async function getDatasetReadings({ thingId, id, ...query }) {
  const resultDataset = await findDatasetByThingIdAndId({ thingId, id })
  if (resultDataset.length === 0) {
    return { statusCode: 404, result: [] }
  } else {
    const result = await getReadings({ id, ...query })
    return { statusCode: 200, result }
  }
}

async function getDatasetReadingsCount({ thingId, id, ...query }) {
  const resultDataset = await findDatasetByThingIdAndId({ thingId, id })
  if (resultDataset.length === 0) {
    return { statusCode: 404, result: {} }
  } else {
    const result = await getReadingsCount({ id, ...query })

    if (result.length === 1 && result[0].reading_count) {
      const resultCount =
        !isNaN(parseInt(result[0].reading_count)) && isFinite(result[0].reading_count)
          ? parseInt(result[0].reading_count)
          : 0

      return { statusCode: 200, result: { count: resultCount } }
    } else {
      return { statusCode: 200, result: { count: 0 } }
    }
  }
}

export default {
  getDatasetByThingIdAndId,
  getDatasetsByThingId,
  putDataset,
  removeDataset,
  getDatasetReadings,
  getDatasetReadingsCount,
}
