/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/host-meta.js The Hostmeta class definition file.
 */

import EventEmitter from 'node:events'
import Debug from 'debug'

const debug = Debug('host-meta:class')

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
    debug('host-meta constructor')
  }
}
