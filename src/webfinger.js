/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/webfinger.js The Webfinger class definition file.
 */

import EventEmitter from 'node:events'
import Debug from 'debug'

const error = Debug('webfinger:class:error')
const log = Debug('webfinger:class:log')
log.log = console.log.bind(console)

/**
 * A class providing Webfinger rfc-7033 support.
 * @summary A class providing Webfinger rfc-7033 support.
 * @class Webfinger
 * @extends EventEmitter
 * @author Matthew Duffy <mattduffy@gmail.com>
 */

export default class Webfinger extends EventEmitter {
  #url = null

  /**
   * Create an instance of Webfinger
   */
  constructor() {
    super()
    log('Webfinger constructor')
  }

  /**
   * Set the URL.
   * @summary Set the URL.
   * @author Matthew Duffy <mattduffy@gmail.com>
   * @param { string } url - URL of the resource to finger.
   * @return { undefinded }
   */
  set url(url) {
    this.#url = url
  }

  /**
   * Get the URL.
   * @summary Get the URL.
   * @author Matthew Duffy <mattduffy@gmail.com>
   * @return { string } The URL.
   */
  get url() {
    return this.#url
  }
}
