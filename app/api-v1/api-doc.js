import env from '../env.js'

const { PORT, API_VERSION } = env

const apiDoc = {
  openapi: '3.0.3',
  info: {
    title: 'ReadingService',
    version: API_VERSION,
  },
  servers: [
    {
      url: `http://localhost:${PORT}/v1`,
    },
  ],
  components: {
    responses: {
      NotFoundError: {
        description: 'This resource cannot be found',
      },
      BadRequestError: {
        description: 'The request is invalid',
      },
      ConflictError: {
        description: 'This resource already exists',
      },
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
      },
      Error: {
        description: 'Something went wrong',
      },
    },
    schemas: {
      Dataset: {
        type: 'object',
        properties: {
          id: {
            description: 'id of the dataset',
            type: 'string',
          },
          thingId: {
            description: 'id of the thing for the dataset',
            type: 'string',
          },
          type: {
            description: 'type of the dataset',
            type: 'string',
          },
          label: {
            description: 'label of the dataset',
            type: 'string',
          },
          unit: {
            description: 'unit of the reading value',
            type: 'string',
          },
        },
        required: ['id', 'thingId', 'type', 'label', 'unit'],
      },
      Reading: {
        type: 'object',
        properties: {
          timestamp: {
            description: 'timestamp of the reading',
            type: 'string',
          },
          value: {
            description: 'value of the reading',
            type: 'string',
          },
        },
        required: ['timestamp', 'value'],
      },
    },
  },
  paths: {},
}

export default apiDoc
