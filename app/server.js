const express = require('express')
const pinoHttp = require('pino-http')
const { initialize } = require('express-openapi')
const compression = require('compression')
const v1ApiDoc = require('./api-v1/api-doc')
const swaggerUi = require('swagger-ui-express')
const bodyParser = require('body-parser')
const { PORT, API_VERSION, API_MAJOR_VERSION } = require('./env')
const logger = require('./logger')
const cors = require('cors')
const path = require('path')
const v1ReadingService = require(`./api-${API_MAJOR_VERSION}/services/readingService`)

const setupReadingsConsumer = require('./readingsConsumer')

async function createHttpServer() {
  const app = express()
  const requestLogger = pinoHttp({ logger })

  app.use((req, res, next) => {
    if (req.path !== '/health') requestLogger(req, res)
    next()
  })

  app.get('/health', async (req, res) => {
    res.status(200).send({ version: API_VERSION, status: 'ok' })
  })

  app.use(cors())
  app.use(compression())
  app.use(bodyParser.json())

  initialize({
    app,
    apiDoc: v1ApiDoc,
    dependencies: {
      readingService: v1ReadingService,
    },
    paths: [path.resolve(__dirname, `api-${API_MAJOR_VERSION}/routes`)],
  })

  const options = {
    swaggerOptions: {
      urls: [
        {
          url: `http://localhost:${PORT}/${API_MAJOR_VERSION}/api-docs`,
          name: 'ReadingService',
        },
      ],
    },
  }

  app.use(`/${API_MAJOR_VERSION}/swagger`, swaggerUi.serve, swaggerUi.setup(null, options))

  // Sorry - app.use checks arity
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.status) {
      res.status(err.status).send({ error: err.status === 401 ? 'Unauthorised' : err.message })
    } else {
      logger.error('Fallback Error %j', err.stack)
      res.status(500).send('Fatal error!')
    }
  })

  const readingsConsumer = await setupReadingsConsumer()

  return { app, readingsConsumer }
}

/* istanbul ignore next */
async function startServer() {
  try {
    const { app, readingsConsumer } = await createHttpServer()

    const setupGracefulExit = ({ sigName, server, exitCode }) => {
      process.on(sigName, async () => {
        await readingsConsumer.disconnect()

        server.close(() => {
          process.exit(exitCode)
        })
      })
    }

    const server = await new Promise((resolve, reject) => {
      let resolved = false
      const server = app.listen(PORT, (err) => {
        if (err) {
          if (!resolved) {
            resolved = true
            reject(err)
          }
        }
        logger.info(`Listening on port ${PORT} `)
        if (!resolved) {
          resolved = true
          resolve(server)
        }
      })
      server.on('error', (err) => {
        if (!resolved) {
          resolved = true
          reject(err)
        }
      })
    })

    setupGracefulExit({ sigName: 'SIGINT', server, exitCode: 0 })
    setupGracefulExit({ sigName: 'SIGTERM', server, exitCode: 143 })
  } catch (err) {
    logger.fatal('Fatal error during initialisation: %j', err)
    process.exit(1)
  }
}

module.exports = { startServer, createHttpServer }
