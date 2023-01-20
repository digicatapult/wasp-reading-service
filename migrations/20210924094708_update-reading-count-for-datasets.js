export const up = async (knex) => {
  return knex.raw(
    'WITH w AS (SELECT dataset_id, count(*) FROM readings GROUP BY dataset_id) UPDATE datasets AS d SET reading_count = w.count FROM w WHERE w.dataset_id = d.id'
  )
}

export const down = function (knex) {
  return knex('datasets').update('reading_count', 0)
}
