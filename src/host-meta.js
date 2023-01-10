/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/host-meta.js The Hostmeta class definition file.
 */

import EventEmitter from 'node:events'
import Debug from 'debug'

const error = Debug('host-meta:class:error')
const log = Debug('host-meta:class:log')
log.log = console.log.bind(console)

/**
 * A class providing host-meta rfc-6415 support.
 * @summary A class providing host-meta rfc-6415 support.
 * @class Hostmeta
 * @extends EventEmitter
 * @author Matthew Duffy <mattduffy@gmail.com>
 */

export default class Hostmeta extends EventEmitter {
  /**
   * Create an instance of Host-meta
   */
  constructor() {
    super()
    log('host-meta constructor')
  }
}
