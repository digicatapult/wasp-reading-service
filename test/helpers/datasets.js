const getDatasets = (context) => context.db('datasets')

const addDataset = async ({ context, thingId, type, label, unit }) => {
  return context
    .db('datasets')
    .insert({ thing_id: thingId, type, label, unit })
    .returning(['id', 'type', 'thing_id AS thingId', 'label', 'unit', 'created_at', 'updated_at'])
}

const createDataset = ({ thingId, type, label, unit }) => {
  return {
    thingId,
    type: type || 'readingTypeOne',
    label: label || 'datasetLabelOne',
    unit: unit || 'readingUnitOne',
  }
}

const createDatasets = ({ thingId, total }) => {
  const datasets = []

  for (let counter = 0; counter < total; counter++) {
    const randomNumber = Math.round(Math.random() * (total - 1) + 1)
    const type = `datasetType-${randomNumber}`
    const label = `datasetLabel-${counter}`
    const unit = `unit-${counter}`
    const dataset = createDataset({
      thingId,
      type,
      label,
      unit,
    })

    datasets.push(dataset)
  }

  return datasets
}

export { getDatasets, createDataset, createDatasets, addDataset }
