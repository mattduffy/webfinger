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

  #finger = {
    subject: '',
    aliases: [],
    links: [],
  }

  /**
   * Create an instance of Webfinger
   */
  constructor(options = {}) {
    if (!options.db) {
      error('Missing required DB connection.')
      throw new Error('Missing required DB connection.')
    }

    super()
    log('Webfinger constructor')
    this._db = options?.db || null
    this._local = options?.local || true
    this._host = options?.host || `http://${process.env.HOST}:${process.env.PORT}`
    this._username = options?.username

    // TODO: stuff for making webfinger request to remote server
  }

  /**
   * Make the webfinger request.
   * @summary Make the webfinger request.
   * @author Matthew Duffy <mattduffy@gmail.com>
   * @param {string} username - Username to finger.
   * @return {Object|null} Object literal containing finger data or null.
   */
  async finger(username = null) {
    if (this._local && !this._db) {
      error('Missing DB connection for local finger request.')
      throw new Error('Missing DB connection for local finger request.')
    }
    if (!username && !this._username) {
      error('Missing required username to finger.')
      throw new Error('Missing required username to finger.')
    }
    const user = username || this._username
    try {
      const foundUser = await this._db.findOne({ username: user })
      if (!foundUser) {
        return null
      }
      this.subject()
      this.aliases(`${this._host}/@${this._username}`)
      this.aliases(`${this._host}/user/${this._username}`)
      this.links({
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html; charset=utf-8',
        href: `${this._host}/@${this._username}`,
      })
      this.links({
        rel: 'http://webfinger.net/rel/avatar',
        type: 'image',
        href: foundUser.avatar,
      })
      this.links({
        rel: 'self',
        type: 'application/activity+json',
        href: `${this._host}/user/${this._username}`,
      })
    } catch (e) {
      error(`Caught error during local finger request: ${e}`)
      return null
    }
    return this.#finger
  }

  subject() {
    const match = /^http[s]?:\/\/([A-Za-z0-9\\._-]+):?[0-9]{0,6}$/.exec(this._host)
    let host
    if (match) {
      /* eslint-disable prefer-destructuring */
      host = match[1]
    } else {
      host = this._host
    }
    this.#finger.subject = `acct:${this._username}@${host}`
  }

  aliases(alias) {
    this.#finger.aliases.push(alias)
  }

  links(link) {
    this.#finger.links.push(link)
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
