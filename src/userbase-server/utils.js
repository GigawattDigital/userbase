import statusCodes from './statusCodes'

// source: https://github.com/manishsaraan/email-validator
const EMAIL_REGEX = /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/
export const validateEmail = (email) => {
  if (!email) return false

  if (email.length > 254) return false

  const valid = EMAIL_REGEX.test(email)
  if (!valid) return false

  // Further checking of some things regex can't handle
  const parts = email.split('@')
  if (parts[0].length > 64) return false

  const domainParts = parts[1].split('.')
  if (domainParts.some(part => part.length > 63)) return false

  return true
}

// estimates the size of a DDB item that we know will be structured a certain way. This
// will not work for arbitrary DDB items that have different data types we are not using
export const estimateSizeOfDdbItem = (item) => {
  let bytes = 0

  for (let attribute in item) {
    if (!item.hasOwnProperty(attribute)) continue

    bytes += attribute.length

    const value = item[attribute]

    switch (typeof value) {
      case 'string':
        bytes += value.length // The size of a string is(length of attribute name) + (number of UTF - 8 - encoded bytes).
        break
      case 'number':
        bytes += Math.ceil((value.toString().length / 2)) + 1 // Numbers are variable length, with up to 38 significant digits.Leading and trailing zeroes are trimmed.The size of a number is approximately(length of attribute name) + (1 byte per two significant digits) + (1 byte).
        break
      case 'boolean':
        bytes += 1 // The size of a null attribute or a Boolean attribute is(length of attribute name) + (1 byte).
        break
      case 'object':
        if (!value) continue // null values
        if (value.type === 'Buffer') {
          bytes += value.data.length // The size of a binary attribute is (length of attribute name) + (number of raw bytes).
        } else {
          bytes += 3 // An attribute of type List or Map requires 3 bytes of overhead, regardless of its contents
          for (let key in value) {
            bytes += estimateSizeOfDdbItem(value[key])
          }
        }
        break
    }
  }

  return bytes
}

export const trimReq = (req) => ({ id: req.id, url: req.url, headers: req.headers })

export const truncateSessionId = (sessionId) => typeof sessionId === 'string' && sessionId.substring(0, 8) // limit sensitive logging

export const getTtl = (expirationDate) => Math.floor(new Date(expirationDate).getTime() / 1000)

export const ttlToDate = (ttl) => new Date(ttl * 1000)

// matches stringToArrayBuffer from userbase-js/Crypto/utils
// https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
export const stringToArrayBuffer = (str) => {
  let buf = new ArrayBuffer(str.length * 2) // 2 bytes for each char
  let bufView = new Uint16Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

// matches arrayBufferToString from userbase-js/Crypto/utils
// https://stackoverflow.com/a/20604561/11601853
export const arrayBufferToString = (buf) => {
  const bufView = new Uint16Array(buf)
  const length = bufView.length
  let result = ''
  let chunkSize = 10 * 1024 // using chunks prevents stack from blowing up

  for (var i = 0; i < length; i += chunkSize) {
    if (i + chunkSize > length) {
      chunkSize = length - i
    }
    const chunk = bufView.subarray(i, i + chunkSize)
    result += String.fromCharCode.apply(null, chunk)
  }

  return result
}

export const getMsUntil1AmPst = () => {
  const time = new Date()

  const UTC_1_AM_HOUR = 9

  if (time.getUTCHours() >= UTC_1_AM_HOUR) {
    time.setUTCDate(time.getUTCDate() + 1)
  }

  time.setUTCHours(UTC_1_AM_HOUR, 0, 0, 0)

  return time.getTime() - Date.now()
}

// convert last evaluated key to a base64 string so it does not confuse developer
export const lastEvaluatedKeyToNextPageToken = (lastEvaluatedKey) => {
  const lastEvaluatedKeyString = JSON.stringify(lastEvaluatedKey)
  const base64LastEvaluatedKey = Buffer.from(lastEvaluatedKeyString).toString('base64')
  return base64LastEvaluatedKey
}

export const nextPageTokenToLastEvaluatedKey = (nextPageToken, validateLastEvaluatedKey) => {
  try {
    if (!nextPageToken) return null

    const lastEvaluatedKeyString = Buffer.from(nextPageToken, 'base64').toString('ascii')
    const lastEvaluatedKey = JSON.parse(lastEvaluatedKeyString)

    if (validateLastEvaluatedKey) validateLastEvaluatedKey(lastEvaluatedKey)

    return lastEvaluatedKey
  } catch {
    throw {
      status: statusCodes['Bad Request'],
      error: { message: 'Next page token invalid.' }
    }
  }
}

export const wait = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms))
