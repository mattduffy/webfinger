/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/webfinger.js The Webfinger class definition file.
 */

import EventEmitter from 'node:events'
import Debug from 'debug'
import get from './get.js'
import filetype from './filetype.js'

const error = Debug('webfinger:class_error')
const log = Debug('webfinger:class_log')

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
    this._db = options?.db ?? null
    this._local = options?.local ?? true
    this._protocol = options?.protocol ?? 'http'
    this._host = options?.host ?? `${process.env.HOST}:${process.env.PORT}`
    this._hostname = `${this._protocol}://${this._host}`
    this._origin = options?.origin ?? null
    this._username = options?.username

    this._imgDir = options?.imgDir ?? null
    this._localHost = process.env.HOST
    this._localPort = process.env.PORT
    this._localDomainName = process.env.DOMAIN_NAME
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
    const user = username ?? this._username[1]
    let foundUser
    // const localAcct = new RegExp(`(${this._localHost}|${this._localDomainName})`)
    // const isLocal = localAcct.test(this._username[2])
    const isLocal = this._local

    try {
      if (isLocal) {
        // finger acct local to this server
        // this is a design problem - too tightly coupled to the actual db collection
        // and not a more abstract model... shouldn't know anything about user.archived
        // @TODO - refactor away from raw db query
        foundUser = await this._db.findOne({ username: user, archived: false })
        if (!foundUser) {
          return null
        }
        this.subject()
        // this.aliases(`${this._hostname}/@${this._username[1]}`)
        this.aliases(`${this._origin}/@${this._username[1]}`)
        // this.aliases(`${this._hostname}/user/${this._username[1]}`)
        this.aliases(`${this._origin}/user/${this._username[1]}`)
        this.links({
          rel: 'http://webfinger.net/rel/profile-page',
          type: 'text/html; charset=utf-8',
          href: `${this._origin}/@${this._username[1]}`,
        })
        // const avatarFile = `${this._imgDir}/${/http.*(i\/accounts\/avatars\/.*)/.exec(foundUser.avatar)[1]}`
        let avatarFile
        let avatarPath
        if (foundUser.avatar !== '') {
          avatarFile = `${this._imgDir}/${foundUser.avatar}`
          avatarPath = `${this._origin}/${foundUser.avatar}`
        } else {
          avatarFile = `${this._imgDir}/i/accounts/avatars/missing.png`
          avatarPath = `${this._origin}/i/accounts/avatars/missing.png`
        }
        const mimetype = await filetype(avatarFile)
        this.links({
          rel: 'http://webfinger.net/rel/avatar',
          type: mimetype.type,
          href: avatarPath,
        })
        this.links({
          rel: 'self',
          type: 'application/activity+json',
          href: `${this._origin}/user/${this._username[1]}`,
        })
        this.links({
          rel: 'http://ostatus.org/schema/1.0/subscribe',
          template: `${this._origin}/authorize_interaction?uri={uri}`,
        })
      } else {
        // finger acct from a remote server
        const remoteFinger = `https://${this._username[2]}/.well-known/webfinger?resource=${this._username.input}`
        error(`remote finger: ${remoteFinger}`)
        const finger = await get(remoteFinger)
        if (finger.statusCode === 200) {
          foundUser = finger.content
        } else {
          foundUser = null
        }
        return foundUser
      }
    } catch (e) {
      error(`Caught error during local finger request: ${e}`)
      return null
    }
    return this.#finger
  }

  subject() {
    const match = /^http[s]?:\/\/([A-Za-z0-9\\._-]+):?[0-9]{0,6}$/.exec(this._hostname)
    let host
    if (match) {
      /* eslint-disable prefer-destructuring */
      host = match[1]
    } else {
      host = this._hostname
    }
    this.#finger.subject = `acct:${this._username[1]}@${host}`
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
