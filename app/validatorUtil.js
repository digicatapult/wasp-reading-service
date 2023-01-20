import validator from 'validator'
import moment from 'moment'
import env from '../app/env.js'

const { API_OFFSET_LIMIT } = env

moment.suppressDeprecationWarnings = true // suppress warning on parse error, this is why we are using moment!!

const isUuidInvalid = (uuid) => {
  return !uuid || !validator.isUUID(uuid)
}

const isDateValid = (date) => {
  return moment(`${date}`).isValid()
}

const isBoundedInteger = (val, lower, upper) => {
  if (!Number.isInteger(parseFloat(val))) {
    return false
  }

  if (Number.isFinite(lower) && parseFloat(val) < lower) {
    return false
  }

  if (Number.isFinite(upper) && parseFloat(val) > upper) {
    return false
  }

  return true
}

const validateGetReadingsQuery = ({ offset, limit, sortByTimestamp, startDate, endDate }) => {
  offset = !isBoundedInteger(offset, 0) ? 0 : parseFloat(offset)
  limit = !isBoundedInteger(limit, 1, API_OFFSET_LIMIT) ? API_OFFSET_LIMIT : parseInt(limit)
  sortByTimestamp =
    sortByTimestamp && (sortByTimestamp.toUpperCase() === 'ASC' || sortByTimestamp.toUpperCase() === 'DESC')
      ? sortByTimestamp
      : 'ASC'
  startDate = !isDateValid(startDate) ? null : moment(`${startDate}`).toISOString()
  endDate = !isDateValid(endDate) ? null : moment(`${endDate}`).toISOString()

  return { offset, limit, sortByTimestamp, startDate, endDate }
}

const isPutRequestBodyInvalid = ({ type, label, unit }) => {
  if (!type || typeof type !== 'string' || !label || typeof label !== 'string' || !unit || typeof unit !== 'string') {
    return true
  } else {
    return false
  }
}

export { isUuidInvalid, validateGetReadingsQuery, isPutRequestBodyInvalid }
