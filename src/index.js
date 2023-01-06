/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/index.js The Webfinger class definition file.
 */

import EventEmitter from 'node:events'
import Debug from 'debug'

const debug = Debug('webfinger:class')

/**
 * A class providing Webfinger rfc-7033 support.
 * @summary A class providing Webfinger rfc-7033 support.
 * @class Webfinger
 * @extends EventEmitter
 * @author Matthew Duffy <mattduffy@gmail.com>
 */

export class Webfinger extends EventEmitter {
  /**
   * Create an instance of Webfinger
   */
  constructor() {
    super()
    debug('Webfinger constructor')
  }
}
