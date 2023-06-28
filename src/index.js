/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/index.js The Webfinger package entrypoint.
 */

import Debug from 'debug'
import get from './get.js'
import post from './post.js'
import Webfinger from './webfinger.js'
import Hostmeta from './host-meta.js'
import NodeInfo from './nodeinfo.js'

function wellknownNodeinfo(options = {}, application = null) {
  const error = Debug('webfinger:wellknown:nodeinfo_error')
  const log = Debug('webfinger:wellknown:nodeinfo_log')
  let app
  let opts
  if (options && typeof options.use === 'function') {
    opts = application
    app = options
  } else {
    /* eslint-disable-next-line no-unused-vars */
    opts = options
    app = application
  }
  if (!app || typeof app.use !== 'function') {
    error('Required app instance not provided')
    throw new Error('Required app instance not provided')
  }
  log('Adding the /.well-known/nodeinfo route to the app.')

  return async function nodeinfo(ctx, next) {
    if (!ctx.state.mongodb) {
      error('Missing db connection')
      ctx.status = 500
      ctx.type = 'text/plain; charset=utf-8'
      throw new Error('Missing db connection')
    }
    let info
    if (/^\/\.well-known\/nodeinfo/.test(ctx.request.path)) {
      try {
        const host = `${ctx.request.protocol}://${ctx.request.host}`
        const o = { db: ctx.state.mongodb.client, host, path: ctx.request.path }
        const node = new NodeInfo(o)
        info = await node.info()
        if (!info) {
          ctx.status = 400
          ctx.type = 'text/plain; charset=utf-8'
          ctx.body = 'Bad request'
        } else {
          ctx.status = 200
          ctx.type = info.type
          ctx.body = info.body
        }
      } catch (e) {
        error(e)
        ctx.status = 500
        // throw new Error(e)
        ctx.throw(500, 'Nodeinfo failure - 100', e)
      }
    } else if (/^\/nodeinfo\/2\.1/.test(ctx.request.path)) {
      const { proto, host } = ctx.request
      const o = { db: ctx.state.mongodb.client, proto, host }
      const node = new NodeInfo(o)
      info = await node.stats()
      if (!info) {
        ctx.status = 404
        ctx.type = 'text/plain; charset=utf-8'
        ctx.body = 'Not Found'
      } else {
        ctx.status = 200
        ctx.type = info.type
        ctx.body = info.body
      }
    } else {
      try {
        await next()
      } catch (e) {
        error('Nodeinfo failure - 200')
        ctx.throw(500, 'Nodeifo failure - 200', e)
      }
    }
  }
}

function wellknownHostmeta(options = {}, application = null) {
  const error = Debug('webfinger:wellknown:hostmeta_error')
  const log = Debug('webfinger:wellknown:hostmeta_log')
  let app
  let opts
  if (options && typeof options.use === 'function') {
    opts = application
    app = options
  } else {
    /* eslint-disable-next-line no-unused-vars */
    opts = options
    app = application
  }
  if (!app || typeof app.use !== 'function') {
    error('Required app instance not provided')
    throw new Error('Required app instance not provided')
  }
  log('Adding the /.well-known/host-meta route to the app.')

  return async function hostmeta(ctx, next) {
    // Doesn't seem like anything other than Mastodon relies on this anymore.
    // No need to make it do anything other than return the default description
    // of the webfinger interface.
    let info
    if (/^\/\.well-known\/host-meta/.test(ctx.request.path)) {
      try {
        const host = `${ctx.request.protocol}://${ctx.request.host}`
        const o = { path: ctx.request.path, host }
        const meta = new Hostmeta(o)
        info = meta.info()
        if (!info) {
          ctx.status = 400
          ctx.type = 'text/plain; charset=utf8'
          ctx.body = 'Bad request'
        } else {
          ctx.status = 200
          ctx.type = info.type
          ctx.body = info.body
        }
      } catch (e) {
        error(e)
        ctx.status = 500
        // throw new Error(e)
        ctx.throw(500, 'Hostmeta failure - 100', e)
      }
    } else {
      try {
        await next()
      } catch (e) {
        error('Hostmeta failure - 200')
        ctx.throw(500, 'Hostmeta failure - 200', e)
      }
    }
  }
}

function wellknownWebfinger(options, application) {
  const error = Debug('webfinger:wellknown:webfinger_error')
  const log = Debug('webfinger:wellknown:webfinger_log')
  let app
  let opts
  if (options && typeof options.use === 'function') {
    opts = application
    app = options
  } else {
    /* eslint-disable-next-line no-unused-vars */
    opts = options
    app = application
  }
  if (!app || typeof app.use !== 'function') {
    error('Required app instance not provided')
    throw new Error('Required app instance not provided')
  }
  log('Adding the /.well-known/webfinger route to the app.')

  return async function webfinger(ctx, next) {
    if (!ctx.state.mongodb) {
      error('Missing db connection')
      ctx.status = 500
      ctx.type = 'text/plain; charset=utf-8'
      // throw new Error('Missing db connection')
    }

    if (/^\/\.well-known\/webfinger/.test(ctx.request.path)) {
      try {
        const re = /^acct:([^\\s][A-Za-z0-9_-]{2,30})(?:@)?([^\\s].*)?$/
        const username = re.exec(ctx.request.query?.resource)
        if (!ctx.request.query.resource || !username) {
          error('Missing resource query parameter.')
          ctx.status = 400
          ctx.type = 'text/plain; charset=utf-8'
          ctx.body = 'Bad request'
        } else {
          const { origin, host, protocol } = ctx.request
          const localAcct = new RegExp(`(${host})`)
          let isLocal = false
          if (username[2] === undefined || localAcct.test(username[2])) {
            isLocal = true
          }
          const db = ctx.state.mongodb.client.db()
          const users = db.collection('users')
          const o = {
            db: users,
            username,
            local: isLocal,
            origin,
            protocol: `${protocol}`,
            host: `${host}`,
            imgDir: app.publicDir,
          }
          const finger = new Webfinger(o)
          const found = await finger.finger()
          if (!found) {
            ctx.status = 404
            ctx.type = 'text/plain; charset=utf-8'
            ctx.body = `${username[1]} not found`
          } else {
            ctx.status = 200
            ctx.type = 'application/jrd+json; charset=utf-8'
            ctx.body = found
          }
        }
      } catch (e) {
        error(e)
        ctx.status = 500
        // throw new Error(e)
        ctx.throw(500, 'Webfinger failure - 100', e)
      }
    } else {
      try {
        await next()
      } catch (e) {
        error('Webfinger failure - 200')
        error(e)
        ctx.throw(500, 'Webfinger failure - 200', e)
      }
    }
  }
}

export {
  get,
  post,
  NodeInfo,
  Hostmeta,
  Webfinger,
  wellknownNodeinfo,
  wellknownHostmeta,
  wellknownWebfinger,
}
