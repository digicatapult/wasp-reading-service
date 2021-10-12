const { before } = require('mocha')
const request = require('supertest')

const { createHttpServer } = require('../../app/server')

let server = null
const setupServer = (context) => {
  before(async function () {
    this.timeout(40000)
    if (!server) {
      server = await createHttpServer()
    }
    context.request = request(server.app)
  })
}

module.exports = { setupServer }
