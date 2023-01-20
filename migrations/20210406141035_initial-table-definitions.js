export const up = async (knex) => {
  // check extension is not installed
  const [extInstalled] = await knex('pg_extension').select('*').where({ extname: 'uuid-ossp' })

  if (!extInstalled) {
    await knex.raw('CREATE EXTENSION "uuid-ossp"')
  }

  const uuidGenerateV4 = () => knex.raw('uuid_generate_v4()')
  const now = () => knex.fn.now()

  await knex.schema.createTable('datasets', (def) => {
    def.uuid('id').primary().defaultTo(uuidGenerateV4())
    def.uuid('thing_id').notNullable()
    def.string('type', 50).notNullable()
    def.string('label', 50).notNullable()
    def.jsonb('metadata').notNullable().defaultTo({})
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())

    def.unique(['thing_id', 'type', 'label'])
  })

  await knex.schema.createTable('readings', (def) => {
    def.uuid('dataset_id').defaultTo(uuidGenerateV4())
    def.datetime('timestamp').notNullable()
    def.float('value').notNullable()
    def.datetime('created_at').notNullable().default(now())
    def.datetime('updated_at').notNullable().default(now())

    def.foreign('dataset_id').references('id').on('datasets').onDelete('CASCADE').onUpdate('CASCADE')
  })

  await knex.raw(`
    ALTER TABLE "readings" ADD PRIMARY KEY ("dataset_id", "timestamp") INCLUDE ("value")
  `)
}

export const down = async (knex) => {
  await knex.schema.dropTable('readings')
  await knex.schema.dropTable('datasets')
  await knex.raw('DROP EXTENSION "uuid-ossp"')
}
