import { before } from 'mocha'
import request from 'supertest'

import { createHttpServer } from '../../app/server.js'

let server = null
export const setupServer = (context) => {
  before(async function () {
    this.timeout(40000)
    if (!server) {
      server = await createHttpServer()
    }
    context.request = request(server.app)
  })
}
