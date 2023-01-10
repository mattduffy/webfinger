/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/get.js A simple HTTPS GET interface.
 */

import Debug from 'debug'
import https from 'node:https'
import http from 'node:http'
import url from 'node:url'

const error = Debug('webfinger:get:error')
const log = Debug('webfinger:get:log')
log.log = console.log.bind(console)

const retries = 2
const followRedirect = true

log('Hi, from Webfinger:get')

function getCallback(response) {
  if (response === null || response === undefined) {
    error('HTTPS reponse not valid')
    throw new Error('HTTPS response not valid.')
  }
  const data = []
  let statusCode = response.statusCode
  let statusMessage = response.statusMessage
  console.log(response.headers)
  response.on('data', (d) => {
    data.push(d)
  })
  response.on('end', () => {
    console.log('Resonse ended: ')
    console.log(JSON.parse(Buffer.concat(data).toString()))
  })
}

export default async function get(q) {
  log(`GETting ${q}`)
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
  const x = http.get(theUrl, getCallback)
  return x
}
