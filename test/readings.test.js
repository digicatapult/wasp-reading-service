const { describe, before, it } = require('mocha')
const { expect } = require('chai')
const moment = require('moment')
const { setupServer } = require('./helpers/server')
const { setupDb } = require('./helpers/db')
const { API_MAJOR_VERSION, API_OFFSET_LIMIT } = require('../app/env')
const { createReadings, insertReadings, deleteReadings } = require('./helpers/readings')

describe('Readings', function () {
  const context = {}

  let date
  let thingId
  let datasetId
  let readings

  setupServer(context)
  setupDb(context)

  before(async function () {
    date = moment().subtract(1, 'month').startOf('day')
    thingId = 'ee4b3481-ce8d-43a6-a8f1-8a8e2fbeb242'
    datasetId = '77784dff-b10c-4f23-9f30-d5dba65f648d'
    await context.db('datasets').del()
    await context.db('datasets').insert({ id: datasetId, thing_id: thingId, type: 'counter', label: 'test_counter' })
  })

  describe('GET Readings with invalid path', function () {
    before(async function () {
      await deleteReadings({ context, datasetId })

      readings = createReadings({ date, datasetId, total: API_OFFSET_LIMIT + 2 })
      await insertReadings({ context, readings, datasetId })
    })

    it(`should return 400 (invalid thingId)`, async function () {
      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/000a0000-a00a-00a0-a000-0000000000/dataset/${datasetId}/reading`
      )

      expect(context.response.status).to.equal(400)
      expect(context.response.body).to.have.length(0)
    })

    it(`should return 400 (invalid datasetId)`, async function () {
      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/000a0000-a00a-00a0-a000-0000000000/reading`
      )

      expect(context.response.status).to.equal(400)
      expect(context.response.body).to.have.length(0)
    })

    it(`should return 404 (invalid datasetId for thingId)`, async function () {
      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/000a0000-a00a-00a0-a000-000000000000/dataset/${datasetId}/reading`
      )

      expect(context.response.status).to.equal(404)
      expect(context.response.body).to.have.length(0)
    })
  })

  describe('GET readings limit/offset', function () {
    before(async function () {
      await deleteReadings({ context, datasetId })

      readings = createReadings({ date, datasetId, total: API_OFFSET_LIMIT + 2 })
      await insertReadings({ context, readings, datasetId })
    })

    it(`should return 200 (length = ${API_OFFSET_LIMIT}) with implicit default limit = ${API_OFFSET_LIMIT}`, async function () {
      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.have.length(API_OFFSET_LIMIT)
    })

    it(`should return 200 (length = ${3}) with default limit, offset = ${API_OFFSET_LIMIT - 1}`, async function () {
      let offset = API_OFFSET_LIMIT - 1
      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading/?offset=${offset}`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.have.length(3)
    })

    it(`should return 200 (length = ${API_OFFSET_LIMIT - 1}) with explicit limit = ${
      API_OFFSET_LIMIT - 1
    }`, async function () {
      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading?limit=${API_OFFSET_LIMIT - 1}`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.have.length(API_OFFSET_LIMIT - 1)
    })

    const invalidParamsTest = ({ limit = API_OFFSET_LIMIT, offset = 0 }) => {
      it(`should return 200 (length = ${API_OFFSET_LIMIT}) with explicit limit = ${limit}, offset = ${offset}`, async function () {
        context.response = await context.request.get(
          `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading?limit=${limit}&offset=${offset}`
        )

        expect(context.response.status).to.equal(200)
        expect(context.response.body).to.have.length(API_OFFSET_LIMIT)
      })
    }

    invalidParamsTest({ limit: API_OFFSET_LIMIT + 1 })
    invalidParamsTest({ limit: 0 })
    invalidParamsTest({ limit: -1 })
    invalidParamsTest({ limit: 'invalid' })
    invalidParamsTest({ limit: '1e309' })
    invalidParamsTest({ offset: -1 })
    invalidParamsTest({ offset: 'invalid' })
  })

  describe('GET readings with sorting', function () {
    let readings
    let readingsHead
    let readingsTail

    before(async function () {
      await deleteReadings({ context, datasetId })

      readings = createReadings({ date, datasetId, total: API_OFFSET_LIMIT })
      readingsHead = readings[0]
      readingsTail = readings[readings.length - 1]
      await insertReadings({ context, readings, datasetId })
    })

    it('should return 200 with implicit default ASC timestamp sorting', async function () {
      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.have.length(readings.length)
      expect(context.response.body[0].timestamp).to.equal(readingsHead.timestamp)
      expect(context.response.body[0].value).to.equal(readingsHead.value)
      expect(context.response.body[API_OFFSET_LIMIT - 1].timestamp).to.equal(readingsTail.timestamp)
      expect(context.response.body[API_OFFSET_LIMIT - 1].value).to.equal(readingsTail.value)
    })

    it('should return 200 with explicit ASC timestamp sorting', async function () {
      const sortByTimestamp = 'asc'

      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading?sortByTimestamp=${sortByTimestamp}`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.have.length(readings.length)
      expect(context.response.body[0].timestamp).to.equal(readingsHead.timestamp)
      expect(context.response.body[0].value).to.equal(readingsHead.value)
      expect(context.response.body[API_OFFSET_LIMIT - 1].timestamp).to.equal(readingsTail.timestamp)
      expect(context.response.body[API_OFFSET_LIMIT - 1].value).to.equal(readingsTail.value)
    })

    it('should return 200 with explicit DESC timestamp sorting', async function () {
      const sortByTimestamp = 'desc'

      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading?sortByTimestamp=${sortByTimestamp}`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.have.length(readings.length)
      expect(context.response.body[0].timestamp).to.equal(readingsTail.timestamp)
      expect(context.response.body[0].value).to.equal(readingsTail.value)
      expect(context.response.body[API_OFFSET_LIMIT - 1].timestamp).to.equal(readingsHead.timestamp)
      expect(context.response.body[API_OFFSET_LIMIT - 1].value).to.equal(readingsHead.value)
    })

    it('should return 200 with explicit INVALID timestamp sorting', async function () {
      const sortByTimestamp = 'INVALID'

      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading?sortByTimestamp=${sortByTimestamp}`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.have.length(readings.length)
      expect(context.response.body[0].timestamp).to.equal(readingsHead.timestamp)
      expect(context.response.body[0].value).to.equal(readingsHead.value)
      expect(context.response.body[API_OFFSET_LIMIT - 1].timestamp).to.equal(readingsTail.timestamp)
      expect(context.response.body[API_OFFSET_LIMIT - 1].value).to.equal(readingsTail.value)
    })
  })

  describe('GET readings with filtering by start and end dates', function () {
    let startDate
    let endDate

    before(async function () {
      await deleteReadings({ context, datasetId })

      readings = createReadings({ date, datasetId, total: API_OFFSET_LIMIT })
      await insertReadings({ context, readings, datasetId })

      startDate = moment(readings[44].timestamp)
      endDate = moment(readings[88].timestamp)
    })

    it(`should return 200 within date range`, async function () {
      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading?startDate=${startDate}&endDate=${endDate}`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.have.length(45)
    })

    it(`should return 200 within invalid date range`, async function () {
      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading?startDate=${null}&endDate=${null}`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.have.length(API_OFFSET_LIMIT)
    })

    it(`should return 200 within valid moment date range`, async function () {
      const startDateS = startDate.format('YYYYMMDDTHHmmss,SSS')
      const endDateS = endDate.format('YYYYMMDDTHHmmss,SSS')

      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading?startDate=${startDateS}&endDate=${endDateS}`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.have.length(45)
    })
  })

  describe('GET readings count with filtering by start and end dates', function () {
    let startDate
    let endDate

    before(async function () {
      await deleteReadings({ context, datasetId })

      readings = createReadings({ date, datasetId, total: API_OFFSET_LIMIT })
      await insertReadings({ context, readings, datasetId })

      startDate = moment(readings[44].timestamp)
      endDate = moment(readings[88].timestamp)
    })

    it(`should return 200 within date range`, async function () {
      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading_count?startDate=${startDate}&endDate=${endDate}`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body.count).to.equal(45)
    })

    it(`should return 200 within invalid date range`, async function () {
      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading_count?startDate=${null}&endDate=${null}`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body.count).to.equal(API_OFFSET_LIMIT)
    })

    it(`should return 200 within valid moment date range`, async function () {
      const startDateS = startDate.format('YYYYMMDDTHHmmss,SSS')
      const endDateS = endDate.format('YYYYMMDDTHHmmss,SSS')

      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading_count?startDate=${startDateS}&endDate=${endDateS}`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body.count).to.equal(45)
    })

    it(`should return 200 within valid moment date range and 0 count`, async function () {
      const startDateS = moment('19900101T000000,000Z', 'YYYYMMDDTHHmmss,SSS')
      const endDateS = moment('19900102T000000,000Z', 'YYYYMMDDTHHmmss,SSS')

      context.response = await context.request.get(
        `/${API_MAJOR_VERSION}/thing/${thingId}/dataset/${datasetId}/reading_count?startDate=${startDateS}&endDate=${endDateS}`
      )

      expect(context.response.status).to.equal(200)
      expect(context.response.body.count).to.equal(0)
    })
  })
})
