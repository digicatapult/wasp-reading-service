const { isUuidInvalid, isPutRequestBodyInvalid } = require('../../../../../validatorUtil')

module.exports = function (readingService) {
  const doc = {
    GET: async function (req, res) {
      const { thingId, id } = req.params

      if (isUuidInvalid(thingId) || isUuidInvalid(id)) {
        res.status(400).json({})
      } else {
        const { statusCode, result } = await readingService.getDatasetByThingIdAndId({ thingId, id })

        res.status(statusCode).json(result)
      }
    },
    PUT: async function (req, res) {
      const { thingId, id } = req.params
      const { label, unit, type } = req.body

      if (isUuidInvalid(thingId) || isUuidInvalid(id) || isPutRequestBodyInvalid({ type, label, unit })) {
        res.status(400).json({})
      } else {
        const { statusCode, result } = await readingService.putDataset({ thingId, id, type, label, unit })

        res.status(statusCode).json(result)
      }
    },
    DELETE: async function (req, res) {
      const { thingId, id } = req.params

      if (isUuidInvalid(thingId) || isUuidInvalid(id)) {
        res.status(400).json({})
      } else {
        const { statusCode } = await readingService.removeDataset({ thingId, id })

        res.status(statusCode).send()
      }
    },
  }

  doc.GET.apiDoc = {
    summary: 'Get dataset',
    parameters: [
      {
        description: 'Thing Id of the dataset',
        in: 'path',
        required: true,
        name: 'thingId',
        allowEmptyValue: true,
      },
      {
        description: 'Id of the dataset',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: true,
      },
    ],
    responses: {
      200: {
        description: 'Return dataset',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Dataset',
            },
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/BadRequestError',
            },
          },
        },
      },
      404: {
        description: 'Resource does not exist',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/NotFoundError',
            },
          },
        },
      },
      default: {
        description: 'An error occurred',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/Error',
            },
          },
        },
      },
    },
    tags: ['datasets'],
  }

  doc.PUT.apiDoc = {
    summary: 'Update dataset',
    parameters: [
      {
        description: 'Thing id of the dataset',
        in: 'path',
        required: true,
        name: 'thingId',
        allowEmptyValue: true,
      },
      {
        description: 'Id of the dataset',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: true,
      },
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
              },
              label: {
                type: 'string',
              },
              unit: {
                type: 'string',
              },
            },
            required: ['type', 'label', 'unit'],
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Update dataset',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Dataset',
            },
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/BadRequestError',
            },
          },
        },
      },
      404: {
        description: 'Resource does not exist',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/NotFoundError',
            },
          },
        },
      },
      default: {
        description: 'An error occurred',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/Error',
            },
          },
        },
      },
    },
    tags: ['datasets'],
  }

  doc.DELETE.apiDoc = {
    summary: 'Delete dataset',
    parameters: [
      {
        description: 'Thing id of the dataset',
        in: 'path',
        required: true,
        name: 'thingId',
        allowEmptyValue: true,
      },
      {
        description: 'Id of the dataset',
        in: 'path',
        required: true,
        name: 'id',
        allowEmptyValue: true,
      },
    ],
    responses: {
      204: {
        description: 'Delete dataset',
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/BadRequestError',
            },
          },
        },
      },
      404: {
        description: 'Resource does not exist',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/NotFoundError',
            },
          },
        },
      },
      default: {
        description: 'An error occurred',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/Error',
            },
          },
        },
      },
    },
    tags: ['datasets'],
  }

  return doc
}
