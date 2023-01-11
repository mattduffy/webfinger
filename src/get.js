/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/get.js A simple HTTPS GET interface.
 */

import Debug from 'debug'
import http from 'node:http'
import https from 'node:https'

const error = Debug('webfinger:get:error')
const log = Debug('webfinger:get:log')
log.log = console.log.bind(console)

log('Hi, from Webfinger:get')

/**
 * Make an HTTP(S) GET request to a given URL.
 * @summary Make an HTTP(S) GET request to a given URL.
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @param { string|URL } q - Either a string containing the url or an instance of URL.
 * @param { object } opts - An object literal with options for how to perform GET request.
 * @return {}
 */
export default function get(q, opts = {}) {
  const options = {
    timeout: 5000,
    retries: 2,
    followRedirect: true,
    ...opts,
  }
  log(`GETting ${q}`)
  log(options)
  if (q === undefined) {
    error('Missing parameter')
    throw new Error('Missing required URL parameter. Usage: get(\'https://www.example.org\')')
  }
  let theUrl
  if (typeof q === 'string') {
    theUrl = new URL(q)
  } else if (q instanceof URL) {
    theUrl = q
  }
  log(theUrl)
  let proto
  if (theUrl.protocol === 'http:') {
    proto = http
  } else {
    proto = https
  }
  log(`${theUrl.protocol}`)
  return proto.get(theUrl, (response) => {
    if (response === null || response === undefined) {
      error(`${theUrl.protocol} response not valid`)
      throw new Error(`${theUrl.protocol} response not valid`)
    }
    const payload = {}
    payload.content = ''
    payload.headers = response.headers
    const data = []
    log('headers: %o', response.headers)
    payload.statusCode = response.statusCode
    payload.statusMessage = response.statusMessage
    log(`statusCode: ${response.statusCode}`)
    log(`statusMessage: ${response.statusMessage}`)

    if (response.statusCode === 301) {
      payload.redirect = true
      payload.location = response.headers.location
    }

    response.on('data', (chunk) => {
      data.push(chunk)
    })

    // Turn this into an Async/Await promise based function
    response.on('end', () => {
      console.log('Resonse ended: ')
      if (response.headers['content-type'] && /json/.test(response.headers['content-type'])) {
        payload.content = JSON.parse(Buffer.concat(data).toString())
      } else if (response.headers['content-type'] && /text\/plain|html/i.test(response.headers['content-type'])) {
        payload.content = Buffer.concat(data).toString()
      }
      return payload
    })
  }).on('error', (e) => {
    error(e)
  })
}
