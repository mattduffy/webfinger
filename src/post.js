/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/post.js A simple HTTPS POST interface.
 */

import Debug from 'debug'
import http from 'node:http'
import https from 'node:https'

const error = Debug('webfinger:post:error')
const log = Debug('webfinger:post:log')
log.log = console.log.bind(console)
log('Hi, from Webfinger:post')
/**
 * Make an HTTP(S) POST request to a given URL.
 * @summary Make an HTTP(S) POST request to a given URL.
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @async
 * @param { string|URL } q - Either a string containing the url or an instance of URL.
 * @param { object } postData - Data to be POSTed to the provided URL.
 * @param { object } opts - An object literal with options for how to perform POST request.
 * @return { Promise } A promise that should immediately resolve with the POST response or reject with error.
 */
export default async function post(q, postData = {}, opts = {}) {
  if (q === undefined) {
    error('Missing required URL parameter')
    throw new Error('Missing required URL parameter. Usage: await post(\'https://www.example.org\', data[,options])')
  }
  const theUrl = (typeof q === 'string') ? new URL(q) : q
  log(theUrl)
  const proto = (theUrl.protocol === 'http:') ? http : https
  log(`${theUrl.protocol}`)
  if (postData === undefined || Object.entries(postData).length === 0) {
    error('Missing data parameter')
    throw new Error('Missing required data paramter.')
  }
  let content
  let contentType
  if (postData.form !== undefined && postData.form !== '') {
    content = postData.form
    contentType = 'application/x-www-form-urlencoded; charset=utf-8'
  }
  if (postData.text !== undefined && postData.text !== '') {
    content = postData.text
    contentType = 'text/plain; charset=utf-8'
  } else if (postData.json !== undefined && postData.json !== '') {
    content = postData.json
    contentType = 'application/json'
  } else if (postData.buffer !== undefined && postData.buffer instanceof Buffer) {
    content = postData.buffer
    contentType = 'application/octet-stream'
  }

  const options = {
    timeout: 5000,
    retries: 2,
    followRedirect: true,
    method: 'POST',
    agent: false,
    ...opts,
  }
  options.headers = {
    'content-type': contentType,
    'x-custome-header': '@mattduffy/webfinger/post',
  }
  log(options)
  return new Promise((resolve, reject) => {
    const request = proto.request(theUrl, options, (response) => {
      const payload = {}
      payload.content = ''
      payload.headers = response.headers
      const data = []
      log('headers: %o', response.headers)
      payload.statusCode = response.statusCode
      payload.statusMessage = response.statusMessage
      log(`statusCode: ${response.statusCode}`)
      log(`statusMessage: ${response.statusMessage}`)
      // collect the emitted chunks into the data array
      response.on('data', (chunk) => {
        data.push(chunk)
      })
      // when the stream ends, convert the chunks array into readable text
      response.on('end', () => {
        if (response.headers['content-type'] && /json/.test(response.headers['content-type'])) {
          payload.content = JSON.parse(Buffer.concat(data).toString())
        } else if (response.headers['content-type'] && /text\/plain|html/i.test(response.headers['content-type'])) {
          payload.content = Buffer.concat(data).toString()
        }
        resolve(payload)
      })
    }).on('error', (e) => {
      error(e)
      reject(e)
    })
    request.write(content)
    request.end()
  })
}
