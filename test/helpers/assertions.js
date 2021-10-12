const { expect } = require('chai')

const assertDataset = (result, expectation) => {
  expect(result.type).to.equal(expectation.type)
  expect(result.label).to.equal(expectation.label)
}

const assertDatasets = (result, expectation) => {
  expect(result.length).to.equal(expectation.length)

  for (let i = 0; i < result.length; i++) {
    assertDataset(result[i], expectation[i])
  }
}

const assertReading = (result, expectation) => {
  expect(result.dataset_id).to.equal(expectation.datasetId)
  expect(result.timestamp.getTime()).to.equal(expectation.timestamp.getTime())
  expect(result.value).to.equal(expectation.value)
}

const assertReadings = (result, expectation) => {
  expect(result.length).to.equal(expectation.length)

  for (let i = 0; i < result.length; i++) {
    assertReading(result[i], expectation[i])
  }
}

module.exports = {
  assertDataset,
  assertDatasets,
  assertReading,
  assertReadings,
}
