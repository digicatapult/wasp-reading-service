export const up = function (knex) {
  return knex.schema.table('datasets', (def) => {
    def.integer('reading_count').notNullable().default(0)
  })
}

export const down = function (knex) {
  return knex.schema.table('datasets', (def) => {
    def.dropColumn('reading_count')
  })
}
