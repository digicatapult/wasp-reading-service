const { Kafka, logLevel: kafkaLogLevels } = require('kafkajs')

const { assertDataset, addReading } = require('./db')
const logger = require('./logger')
const { KAFKA_BROKERS, KAFKA_LOG_LEVEL, KAFKA_READINGS_TOPIC, KAFKA_READINGS_NOTIFICATIONS_TOPIC } = require('./env')

const setupReadingsConsumer = async () => {
  const kafkaLogger = logger.child({ module: 'kafkajs-readings', level: 'error' })
  const logCreator = () => ({ label, log }) => {
    const { message } = log
    kafkaLogger[label.toLowerCase()]({
      message,
    })
  }

  const kafka = new Kafka({
    clientId: 'reading-service-readings', // TODO: this should be particular to this packet-forwarder
    brokers: KAFKA_BROKERS,
    logLevel: kafkaLogLevels[KAFKA_LOG_LEVEL.toUpperCase()],
    logCreator,
  })

  const producer = kafka.producer()
  await producer.connect()

  const consumer = kafka.consumer({ groupId: 'reading-service-readings' })
  await consumer.connect()
  await consumer.subscribe({ topic: KAFKA_READINGS_TOPIC, fromBeginning: true })

  //  TODO: work out correct behaviour here
  await consumer
    .run({
      eachMessage: async ({ message: { key: thingId, value } }) => {
        try {
          logger.debug('Reading received for %s', thingId)
          logger.trace(`Reading is ${value.toString('utf8')}`)
          const reading = JSON.parse(value.toString('utf8'))
          const dataset = await assertDataset(reading.dataset)
          await addReading({ ...reading, dataset })

          // Broadcast for streaming service
          await producer.send({
            topic: KAFKA_READINGS_NOTIFICATIONS_TOPIC,
            messages: [
              {
                key: dataset.id,
                value: JSON.stringify({ dataset, reading }),
              },
            ],
          })
        } catch (err) {
          logger.warn(`Unexpected error processing payload. Error was ${err.message || err}`)
        }
      },
    })
    .then(() => {
      logger.info(`Kafka consumer has started`)
    })
    .catch((err) => {
      logger.fatal(`Kafka consumer could not start consuming. Error was ${err.message || err}`)
    })

  return {
    disconnect: async () => {
      try {
        await consumer.stop()
        await consumer.disconnect()
      } catch (err) {
        logger.warn(`Error disconnecting from kafka: ${err.message || err}`)
      }
    },
  }
}

module.exports = setupReadingsConsumer
