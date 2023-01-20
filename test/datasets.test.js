import { describe, before, it } from 'mocha'
import { expect } from 'chai'
import delay from 'delay'
import { setupServer } from './helpers/server.js'
import { setupDb } from './helpers/db.js'
import { createDataset, createDatasets, addDataset } from './helpers/datasets.js'

describe('Datasets', function () {
  const context = {}

  let thingId
  let datasets
  let datasetsTail

  setupServer(context)
  setupDb(context)

  before(function () {
    thingId = 'ee4b3481-ce8d-43a6-a8f1-8a8e2fbeb242'
  })

  describe('GET datasets', function () {
    before(async function () {
      await context.db('datasets').del()

      datasets = createDatasets({ thingId, total: 10 })
      datasetsTail = datasets.length

      datasets.forEach(async ({ thingId, type, label }) => {
        await addDataset({ context, thingId, type, label })
      })
      await delay(100)
    })

    it('should return 400', async function () {
      context.response = await context.request.get(`/v1/thing/000a0000-a00a-00a0-a000-0000000000/dataset`)

      expect(context.response.status).to.equal(400)
      expect(context.response.body).to.deep.equal([])
    })

    it('should return 200 with no results', async function () {
      context.response = await context.request.get(`/v1/thing/000a0000-a00a-00a0-a000-000000000000/dataset`)

      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.deep.equal([])
    })

    it('should return 200 with results', async function () {
      context.response = await context.request.get(`/v1/thing/${thingId}/dataset`)

      expect(context.response.status).to.equal(200)
      expect(context.response.body).to.have.length(datasetsTail)
    })
  })

  describe('PUT dataset', function () {
    before(async function () {
      await context.db('datasets').del()

      const { type, label } = createDataset({ thingId })

      await addDataset({ context, thingId, type, label })
      await delay(100)
    })

    it('should return 400 (invalid thingId)', async function () {
      const { body } = await context.request.get(`/v1/thing/${thingId}/dataset`)

      const updatedDataset = {
        label: 'dataset-zero',
      }

      context.response = await context.request
        .put(`/v1/thing/000a0000-a00a-00a0-a000-0000000000/dataset/${body[0].id}`)
        .send(updatedDataset)

      expect(context.response.status).to.equal(400)
      expect(context.response.body).to.deep.equal({})
    })

    it('should return 400 (invalid datasetId)', async function () {
      const updatedDataset = {
        label: 'dataset-zero',
      }

      context.response = await context.request
        .put(`/v1/thing/${thingId}/dataset/000a0000-a00a-00a0-a000-0000000000`)
        .send(updatedDataset)

      expect(context.response.status).to.equal(400)
      expect(context.response.body).to.deep.equal({})
    })

    it('should return 400 (invalid body)', async function () {
      const { body } = await context.request.get(`/v1/thing/${thingId}/dataset`)
      const updatedDataset = null

      context.response = await context.request.put(`/v1/thing/${thingId}/dataset/${body[0].id}`).send(updatedDataset)

      expect(context.response.status).to.equal(400)
      expect(context.response.body).to.deep.equal({})
    })

    it('should return 404 (invalid dataset for thingId)', async function () {
      const { body } = await context.request.get(`/v1/thing/${thingId}/dataset`)

      const updatedDataset = {
        type: 'dataset-zero',
        label: 'datasetLabel-zero',
        unit: 'datasetUnit-zero',
      }

      context.response = await context.request
        .put(`/v1/thing/000a0000-a00a-00a0-a000-000000000000/dataset/${body[0].id}`)
        .send(updatedDataset)

      expect(context.response.status).to.equal(404)
      expect(context.response.body).to.deep.equal({})
    })

    it('should return 200', async function () {
      const { body } = await context.request.get(`/v1/thing/${thingId}/dataset`)

      const updatedDataset = {
        type: 'dataset-zero',
        label: 'datasetLabel-zero',
        unit: 'datasetUnit-zero',
      }

      context.response = await context.request.put(`/v1/thing/${thingId}/dataset/${body[0].id}`).send(updatedDataset)

      expect(context.response.status).to.equal(200)
      expect(context.response.body.type).to.equal(updatedDataset.type)
      expect(context.response.body.label).to.equal(updatedDataset.label)
    })
  })

  describe('GET dataset', function () {
    let dataset

    before(async function () {
      await context.db('datasets').del()

      const { type, label } = createDataset({ thingId })

      dataset = await addDataset({ context, thingId, type, label })
      await delay(100)
    })

    it('should return 400 (invalid thingId)', async function () {
      context.response = await context.request.get(
        `/v1/thing/000a0000-a00a-00a0-a000-0000000000/dataset/000a0000-a00a-00a0-a000-0000000000`
      )

      expect(context.response.status).to.equal(400)
      expect(context.response.body).to.deep.equal({})
    })

    it('should return 400 (invalid datasetId)', async function () {
      context.response = await context.request.get(
        `/v1/thing/000a0000-a00a-00a0-a000-0000000000/dataset/000a0000-a00a-00a0-a000-0000000000`
      )

      expect(context.response.status).to.equal(400)
      expect(context.response.body).to.deep.equal({})
    })

    it('should return 400 (invalid thingId for datasetId)', async function () {
      context.response = await context.request.get(
        `/v1/thing/000a0000-a00a-00a0-a000-000000000000/dataset/${dataset[0].id}`
      )

      expect(context.response.status).to.equal(404)
      expect(context.response.body).to.deep.equal({})
    })

    it('should return 200', async function () {
      context.response = await context.request.get(`/v1/thing/${thingId}/dataset/${dataset[0].id}`)

      expect(context.response.status).to.equal(200)
      expect(context.response.body.id).to.equal(dataset[0].id)
      expect(context.response.body.thingId).to.equal(dataset[0].thingId)
      expect(context.response.body.type).to.equal(dataset[0].type)
      expect(context.response.body.label).to.equal(dataset[0].label)
    })
  })

  describe('DELETE dataset', function () {
    let datasetId

    before(async function () {
      await context.db('datasets').del()

      const { type, label } = createDataset({ thingId })

      const datasetResult = await addDataset({ context, thingId, type, label })
      datasetId = datasetResult[0].id
      await delay(100)
    })

    it('should return 400 (invalid thingId)', async function () {
      context.response = await context.request.delete(
        `/v1/thing/000a0000-a00a-00a0-a000-0000000000/dataset/${datasetId}`
      )

      expect(context.response.status).to.equal(400)
      expect(context.response.body).to.deep.equal({})
    })

    it('should return 400 (invalid datasetId)', async function () {
      context.response = await context.request.delete(
        `/v1/thing/000a0000-a00a-00a0-a000-0000000000/dataset/000a0000-a00a-00a0-a000-0000000000`
      )

      expect(context.response.status).to.equal(400)
      expect(context.response.body).to.deep.equal({})
    })

    it('should return 400 (invalid datasetId for thingId)', async function () {
      context.response = await context.request.delete(
        `/v1/thing/000a0000-a00a-00a0-a000-000000000000/dataset/${datasetId}`
      )

      expect(context.response.status).to.equal(404)
      expect(context.response.body).to.deep.equal({})
    })

    it('should return 204', async function () {
      context.response = await context.request.delete(`/v1/thing/${thingId}/dataset/${datasetId}`)

      expect(context.response.status).to.equal(204)
      expect(context.response.body).to.deep.equal({})
    })
  })
})
