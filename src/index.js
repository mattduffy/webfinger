/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/index.js The Webfinger class definition file.
 */

import Debug from 'debug'
import get from './get.js'
import Webfinger from './webfinger.js'
// import Hostmeta from './host-meta.js'

const error = Debug('webfinger:main:error')
const log = Debug('webfinger:main:log')
log.log = console.log.bind(console)
log('Hi, from Webfinger:index')

get('https://social.treehouse.systems/.well-known/webfinger?resource=acct:mattduffy@social.treehouse.systems')

const webfinger = new Webfinger()
// const hostmeta = new Hostmeta()

export {
  get,
  webfinger,
  // hostmeta,
}
