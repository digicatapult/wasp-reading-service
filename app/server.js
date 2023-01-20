import express from 'express'
import pinoHttp from 'pino-http'
import { initialize } from 'express-openapi'
import compression from 'compression'
import swaggerUi from 'swagger-ui-express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import env from './env.js'
import logger from './logger.js'
import v1ApiDoc from './api-v1/api-doc.js'
import v1ReadingService from './api-v1/services/readingService.js'

import setupReadingsConsumer from './readingsConsumer.js'

const { PORT, API_VERSION } = env
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    paths: [path.resolve(__dirname, 'api-v1/routes')],
  })

  const options = {
    swaggerOptions: {
      urls: [
        {
          url: `http://localhost:${PORT}/v1/api-docs`,
          name: 'ReadingService',
        },
      ],
    },
  }

  app.use(`/v1/swagger`, swaggerUi.serve, swaggerUi.setup(null, options))

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

export { startServer, createHttpServer }
