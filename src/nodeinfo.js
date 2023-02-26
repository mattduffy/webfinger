/**
 * @module @mattduffy/webfinger @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/nodeinfo.js The Nodeinfo class definition file.
 */

import EventEmitter from 'node:events'
import Debug from 'debug'

const error = Debug('webfinger:nodeinfo:class_error')
const log = Debug('webfinger:nodeinfo:class_log')

/**
 * A class providing NodeInfo protocol 2.1 support.
 * @summary A class providing NodeInfo protocol 2.1 support.
 * @class NodeInfo
 * @extends EventEmitter
 * @author Matthew Duffy <mattduffy@gmail.com>
 */

export default class NodenIfo extends EventEmitter {
  #info = { links: [] }

  #protocolVer = '2.1'

  #protocolType = 'application/json; profile="http://nodeinfo.diaspora.software/ns/schema/2.1#'

  #protocolRel = 'http://nodeinfo.diaspora.software/ns/schema/2.1'

  #protocolHref = `https://${this._host}/nodeinfo/2.1`

  #stats = { body: null, type: null }

  constructor(options = {}) {
    if (!options?.db) {
      error('Missing required DB connection.')
      throw new Error('Missing required DB connection.')
    }
    super()
    log('Nodeinfo constructor')
    this._db = options?.db ?? null
    this._collection = options?.collectionName ?? 'nodeinfo'
    this._host = options?.host ?? `http://${process.env.HOST}:${process.env.PORT}`
    this.#protocolHref = `${this._host}/nodeinfo/2.1`
  }

  /**
   * Make the nodeinfo request.
   * @summary Make the nodeinfo request.
   * @async
   * @author Matthew Duffy <mattduffy@gmail.com>
   * @return {Object|null} Object literal containing nodeinfo data or null.
   */
  async stats() {
    if (!this._db) {
      error('Missing DB connection for nodeinfo request.')
      throw new Error('Missing DB connection for nodeinfo request.')
    }
    let stats
    try {
      await this._db.connect()
      const nodeinfo = this._db.db('mattmadethese').collection('nodeinfo')
      stats = await nodeinfo.findOne()
      if (!stats) {
        return null
      }
      this.#stats.body = stats
      this.#stats.type = 'application/json'
      // log(this.#stats)
    } catch (e) {
      error(`Caught error during nodeinfo statistics request: ${e}`)
      throw new Error(`Caught error during nodeinfo statistics request: ${e}`)
    }
    return this.#stats
  }

  /**
   * Make the nodeinfo request.
   * @summary Make the nodeinfo request.
   * @author Matthew Duffy <mattduffy@gmail.com>
   * @return {Object|null} Object literal containing nodeinfo data or null.
   */
  async info() {
    if (!this._db) {
      error('Missing DB connection for local finger request.')
      throw new Error('Missing DB connection for local finger request.')
    }
    try {
      this.#info.links.push({ rel: this.#protocolRel, href: this.#protocolHref })
    } catch (e) {
      error(`Caught error during local finger request: ${e}`)
      return null
    }
    return { type: this.#protocolType, body: this.#info }
  }
}
