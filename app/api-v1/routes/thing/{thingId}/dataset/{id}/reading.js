const { isUuidInvalid, validateGetReadingsQuery } = require('../../../../../../validatorUtil')

module.exports = function (readingService) {
  const doc = {
    GET: async function (req, res) {
      const { thingId, id } = req.params

      if (isUuidInvalid(thingId) || isUuidInvalid(id)) {
        res.status(400).json([])
      } else {
        const validatedParams = validateGetReadingsQuery(req.query)

        const { statusCode, result } = await readingService.getDatasetReadings({ thingId, id, ...validatedParams })

        res.status(statusCode).json(result)
      }
    },
  }

  doc.GET.apiDoc = {
    summary: 'Get Dataset Readings',
    parameters: [
      {
        description: 'Thing Id of the Dataset',
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
      {
        description: 'Offset for result of readings',
        in: 'query',
        required: false,
        name: 'offset',
        allowEmptyValue: false,
      },
      {
        description: 'Limit for result of readings',
        in: 'query',
        required: false,
        name: 'limit',
        allowEmptyValue: false,
      },
      {
        description: 'Sort by timestamp for ordering of readings',
        in: 'query',
        required: false,
        name: 'sortByTimestamp',
        allowEmptyValue: false,
      },
      {
        description: 'Start date for time filtering of readings',
        in: 'query',
        required: false,
        name: 'startDate',
        allowEmptyValue: false,
      },
      {
        description: 'End date for time filtering of readings',
        in: 'query',
        required: false,
        name: 'endDate',
        allowEmptyValue: false,
      },
    ],
    responses: {
      200: {
        description: 'Return readings',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Reading',
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
    tags: ['readings'],
  }

  return doc
}
