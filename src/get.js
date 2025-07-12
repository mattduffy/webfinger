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
 * @async
 * @param { string|URL } q - Either a string containing the url or an instance of URL.
 * @param { Object } opts - An object literal with options for how to perform GET request.
 * @return { Promise } A promise that should immediately resolve with the GET response or reject with error.
 */
export default async function get(q, opts = {}) {
  log(`GETting ${q}`)
  if (q === undefined) {
    error('Missing parameter')
    throw new Error('Missing required URL parameter. Usage: get(\'https://www.example.org\'[,options])')
  }
  const theUrl = (typeof q === 'string') ? new URL(q) : q
  log(theUrl)
  const proto = (theUrl.protocol === 'http:') ? http : https
  log(`${theUrl.protocol}`)
  const options = {
    timeout: 5000,
    retries: 2,
    followRedirect: true,
    ...opts,
  }
  log(options)
  return new Promise((resolve, reject) => {
    proto.get(theUrl, options, (response) => {
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
      // collect the emitted chunks into the data array
      response.on('data', (chunk) => {
        data.push(chunk)
      })
      // when the stream ends, convert the chunks array into readable text
      response.on('end', () => {
        // log('Resonse ended: ')
        if (response.headers['content-type'] && /json/.test(response.headers['content-type'])) {
          payload.content = JSON.parse(Buffer.concat(data).toString())
        } else if (response.headers['content-type'] && /text|application\/plain|html|xml/i.test(response.headers['content-type'])) {
          payload.content = Buffer.concat(data).toString()
        } else if (response.headers['content-type'] && /image/i.test(response.headers['content-type'])) {
          log(`GET status: ${response.statusCode}, ${response.statusMessage}, content-type: ${response.headers['content-type']}`)
          // https://chrisfrew.in/blog/saving-images-in-node-js-using-fetch-with-array-buffer-and-buffer/
          payload.buffer = Buffer.concat(data)
        } else {
          // content is not text-based (plain|html|xml|json) and not an image...
          log(`catch-all for content-type: ${response.headers['content-type']}`)
          payload.buffer = Buffer.concat(data)
        }
        payload.contentType = response.headers['content-type']
        resolve(payload)
      })
    }).on('error', (e) => {
      error(e)
      reject(e)
    })
  })
}
