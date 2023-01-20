export const up = function (knex) {
  return knex.schema.table('datasets', (def) => {
    def.string('unit', 50).notNullable().default('')
  })
}

export const down = function (knex) {
  return knex.schema.table('datasets', (def) => {
    def.dropColumn('unit')
  })
}
