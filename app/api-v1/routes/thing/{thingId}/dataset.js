const { isUuidInvalid } = require('../../../../validatorUtil')

module.exports = function (readingService) {
  const doc = {
    GET: async function (req, res) {
      const { thingId } = req.params

      if (isUuidInvalid(thingId)) {
        res.status(400).json([])
      } else {
        const { statusCode, result } = await readingService.getDatasetsByThingId({ thingId })

        res.status(statusCode).json(result)
      }
    },
  }

  doc.GET.apiDoc = {
    summary: 'Get Datasets',
    parameters: [
      {
        description: 'Thing Id of the Dataset',
        in: 'path',
        required: true,
        name: 'thingId',
        allowEmptyValue: true,
      },
    ],
    responses: {
      200: {
        description: 'Return datasets',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Dataset',
              },
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
