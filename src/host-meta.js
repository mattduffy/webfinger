/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/host-meta.js The Hostmeta class definition file.
 */

import EventEmitter from 'node:events'
import Debug from 'debug'

const error = Debug('host-meta:class_error')
const log = Debug('host-meta:class_log')

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
  constructor(options = {}) {
    super()
    log('host-meta constructor')
    this._host = options?.host || 'localhost'
    this._path = options?.path
    this._type = (/.*json?/.test(this._path)) ? 'json' : 'xrd'
    log('%o', options)
    log(`ctx path: ${this._path}`)
    log(`type: ${this._type}`)
    this._meta = { type: null, body: null }
    if (this._type === 'json') {
      this._meta.type = 'application/jrd+json'
      this._meta.body = this.jrd
    } else {
      this._meta.type = 'application/xrd+xml'
      this._meta.body = this.xrd
    }
  }

  info() {
    return this._meta
  }

  get jrd() {
    return {
      // subject: this._path,
      links: [
        {
          rel: 'lrdd',
          template: `${this._host}/.well-known/webfinger?resource={uri}`,
        },
      ],
    }
  }

  get xrd() {
    return '<?xml version="1.0" encoding="UTF-8"?>\n'
           + '<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">\n'
           + ` <Link rel="lrdd" template="${this._host}/.well-known/webfinger?resource={uri}"/>\n`
           + '</XRD>\n'
  }
}
