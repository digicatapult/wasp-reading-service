const { before, after } = require('mocha')
const { Kafka, logLevel: kafkaLogLevels } = require('kafkajs')
const delay = require('delay')

const { KAFKA_BROKERS, KAFKA_READINGS_NOTIFICATIONS_TOPIC } = require('../../app/env')

let producer = null,
  consumer = null
const setupKafka = () => {
  before(async function () {
    this.timeout(30000)

    const kafka = new Kafka({
      clientId: 'test-reading-service',
      brokers: KAFKA_BROKERS,
      logLevel: kafkaLogLevels.NOTHING,
    })

    producer = kafka.producer()
    await producer.connect()

    const messages = []
    const rawConsumer = kafka.consumer({ groupId: 'test-reading-service' })
    await rawConsumer.connect()
    await rawConsumer.subscribe({ topic: KAFKA_READINGS_NOTIFICATIONS_TOPIC, fromBeginning: false })
    await rawConsumer.run({
      eachMessage: async ({ message: { key, value } }) => {
        messages.push({ key: key.toString('utf8'), value: JSON.parse(value.toString('utf8')) })
      },
    })

    consumer = {
      getMessages: () => [...messages],
      clearMessages: () => {
        messages.splice(0, messages.length)
      },
      waitForNMessages: async (n) => {
        for (let i = 0; i < 5 && messages.length < n; i++) {
          await delay(100)
        }
        await delay(100)
        return messages
      },
      disconnect: async () => {
        await rawConsumer.disconnect()
      },
    }
  })

  after(async function () {
    this.timeout(30000)

    await producer.disconnect()
    await consumer.disconnect()
    consumer.clearMessages()
    producer = null
    consumer = null
  })
}

const getProducer = () => {
  if (producer === null) {
    throw new Error('Tried to get test producer whilst not instantiated')
  } else {
    return producer
  }
}

const getConsumer = () => {
  if (consumer === null) {
    throw new Error('Tried to get test consumer whilst not instantiated')
  } else {
    return consumer
  }
}

module.exports = {
  setupKafka,
  getProducer,
  getConsumer,
}
