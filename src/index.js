/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/index.js The Webfinger class definition file.
 */

import Debug from 'debug'
import get from './get.js'
import Webfinger from './webfinger.js'
import Hostmeta from './host-meta.js'

const debug = Debug('webfinger:main')
debug('Webfinger::Main')
get('https://social.treehouse.systems/.well-known/webfinger?resource=acct:mattduffy@social.treehouse.systems')
const webfinger = new Webfinger()
webfinger.url = 'https://social.treehouse.systems/.well-known/webfinger?resource=acct:mattduffy@social.treehouse.systems'

const hostmeta = new Hostmeta()

export {
  get,
  webfinger,
  hostmeta,
}
