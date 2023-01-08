/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/index.js The Webfinger class definition file.
 */

import Debug from 'debug'
import get from './get.js'
// import hostmeta from './host-meta.js'
// import webfinger from './webfinger.js'

const debug = Debug('webfinger:main')
debug('Webfinger::Main')
get('https://social.treehouse.systems/.well-known/webfinger?resource=acct:mattduffy@social.treehouse.systems')

export {
  get,
//   hostmeta,
//   webfinger,
}
