import { describe, before, it } from 'mocha'
import { expect } from 'chai'
import env from '../app/env.js'

import { setupServer } from './helpers/server.js'

const { API_VERSION } = env

describe('health', function () {
  const context = {}
  setupServer(context)

  before(async function () {
    context.response = await context.request.get('/health')
  })

  it('should return 200', function () {
    expect(context.response.status).to.equal(200)
  })

  it('should return success', function () {
    expect(context.response.body).to.deep.equal({ version: API_VERSION, status: 'ok' })
  })
})
