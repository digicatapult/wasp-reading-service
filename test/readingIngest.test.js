const { describe, before, it } = require('mocha')
const { expect } = require('chai')

const { setupServer } = require('./helpers/server')
const { setupKafka, getConsumer } = require('./helpers/kafka')
const { setupDbKafka } = require('./helpers/db')
const { publishReadingAndWait, getReadings } = require('./helpers/readings')
const { getDatasets } = require('./helpers/datasets')
const { assertDatasets, assertReadings } = require('./helpers/assertions')

const thingId = 'ee4b3481-ce8d-43a6-a8f1-8a8e2fbeb242'
const readingTimestamp = '2021-04-07T00:00:00.000Z'
const readingTimestamp2 = '2021-04-07T01:00:00.000Z'

describe('reading ingest', function () {
  const context = {}
  setupServer(context)
  setupDbKafka(context)
  setupKafka()

  describe('simple reading', function () {
    before(async function () {
      getConsumer().clearMessages()
      await publishReadingAndWait({
        context,
        thingId,
        type: 'temperature',
        label: 'testLabel',
        unit: 'testUnit',
        timestamp: readingTimestamp,
        value: 42,
      })
      await getConsumer().waitForNMessages(1)
      context.datasets = await getDatasets(context)
      context.readings = await getReadings(context)
    })

    it('should create the dataset', function () {
      assertDatasets(context.datasets, [{ type: 'temperature', label: 'testLabel', unit: 'testUnit' }])
    })

    it('should create the reading', function () {
      assertReadings(context.readings, [
        { datasetId: context.datasets[0].id, timestamp: new Date(readingTimestamp), value: 42 },
      ])
    })

    it('should update dataset reading_count', function () {
      expect(context.datasets[0].reading_count).to.equal(1)
    })

    it('should produce a reading notification', async function () {
      const messages = getConsumer().getMessages()
      expect(messages.length).to.equal(1)
      expect(messages[0]).to.have.property('key')
      expect(messages[0]).to.have.property('value')
      expect(messages[0].value).to.have.property('dataset')
      expect(messages[0].value.dataset).to.have.property('createdAt')
      expect(messages[0].value.dataset).to.have.property('updatedAt')
      expect(messages[0].value.dataset).to.have.property('id')
      expect(messages[0].value.dataset).to.have.property('label')
      expect(messages[0].value.dataset).to.have.property('unit')
      expect(messages[0].value.dataset).to.have.property('type')
      expect(messages[0].value.dataset).to.have.property('thingId')
      expect(messages[0].value.dataset.thingId).to.equal(thingId)
      expect(messages[0].value).to.have.property('reading')
      expect(messages[0].value.reading).to.have.property('dataset')
      expect(messages[0].value.reading).to.have.property('timestamp')
      expect(messages[0].value.reading).to.have.property('value')
    })
  })

  describe('multiple readings', function () {
    before(async function () {
      getConsumer().clearMessages()
      await publishReadingAndWait({
        context,
        thingId,
        type: 'temperature',
        label: 'testLabel',
        unit: 'testUnit',
        timestamp: readingTimestamp,
        value: 42,
      })
      await publishReadingAndWait({
        context,
        thingId,
        type: 'temperature',
        label: 'testLabel',
        unit: 'testUnit',
        timestamp: readingTimestamp2,
        value: 43,
      })
      await getConsumer().waitForNMessages(2)
      context.datasets = await getDatasets(context)
      context.readings = await getReadings(context)
    })

    it('should create the dataset', function () {
      assertDatasets(context.datasets, [{ type: 'temperature', label: 'testLabel', unit: 'testUnit' }])
    })

    it('should create the reading', function () {
      assertReadings(context.readings, [
        { datasetId: context.datasets[0].id, timestamp: new Date(readingTimestamp), value: 42 },
        { datasetId: context.datasets[0].id, timestamp: new Date(readingTimestamp2), value: 43 },
      ])
    })

    it('should update dataset reading_count', function () {
      expect(context.datasets[0].reading_count).to.equal(2)
    })

    it('should produce multiple reading notifications', async function () {
      const messages = getConsumer().getMessages()
      expect(messages.length).to.equal(2)
      for (let i = 0; i < messages.length; i++) {
        expect(messages[i]).to.have.property('key')
        expect(messages[i]).to.have.property('value')
        expect(messages[i].value).to.have.property('dataset')
        expect(messages[i].value.dataset).to.have.property('createdAt')
        expect(messages[i].value.dataset).to.have.property('updatedAt')
        expect(messages[i].value.dataset).to.have.property('id')
        expect(messages[i].value.dataset).to.have.property('label')
        expect(messages[i].value.dataset).to.have.property('unit')
        expect(messages[i].value.dataset).to.have.property('type')
        expect(messages[i].value.dataset).to.have.property('thingId')
        expect(messages[i].value.dataset.thingId).to.equal(thingId)
        expect(messages[i].value).to.have.property('reading')
        expect(messages[i].value.reading).to.have.property('dataset')
        expect(messages[i].value.reading).to.have.property('timestamp')
        expect(messages[i].value.reading).to.have.property('value')
      }
    })
  })

  describe('matching table rows', () => {
    before(async function () {
      getConsumer().clearMessages()
      await publishReadingAndWait({
        context,
        thingId,
        type: 'temperature',
        label: 'testLabel',
        unit: 'testUnit',
        timestamp: readingTimestamp,
        value: 42,
      })
      await getConsumer().waitForNMessages(1)
      context.datasets = await getDatasets(context)
    })
    it('should update unit on matching unit', async () => {
      await publishReadingAndWait({
        context,
        thingId,
        type: 'temperature',
        label: 'testLabel',
        unit: 'updatedUnit',
        timestamp: readingTimestamp,
        value: 42,
      })
      await getConsumer().waitForNMessages(1)
      context.datasets = await getDatasets(context)
      expect(context.datasets[0].unit).to.equal('updatedUnit')
    })
  })
})
