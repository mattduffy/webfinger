/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/get.js A simple HTTPS GET interface.
 */

import Debug from 'debug'

const debug = Debug('webfinger:GET')

debug('Webfinger::GET')
export default async function get(url) {
  debug(`GETting ${url}`)
}
