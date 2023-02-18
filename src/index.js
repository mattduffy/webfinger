/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/index.js The Webfinger class definition file.
 */

import Debug from 'debug'
import get from './get.js'
import post from './post.js'
import Webfinger from './webfinger.js'
import Hostmeta from './host-meta.js'

function wellknownHostmeta(options = {}, application = null) {
  const error = Debug('webfinger:wellknown:hostmeta_error')
  const log = Debug('webfinger:wellknown:hostmeta_log')
  let app
  let opts
  if (options && typeof options.use === 'function') {
    opts = application
    app = options
  } else {
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
    // await next()
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
        ctx.status = 500
        error(e)
        throw new Error(e)
      }
    } else {
      await next()
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
    opts = options
    app = application
  }
  if (!app || typeof app.use !== 'function') {
    error('Required app instance not provided')
    throw new Error('Required app instance not provided')
  }
  log('Adding the /.well-known/webfinger route to the app.')

  return async function webfinger(ctx, next) {
    // await next()
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
          const { host, protocol } = ctx.request
          const localAcct = new RegExp(`(${host})`)
          const isLocal = localAcct.test(username[2])
          const db = ctx.state.mongodb.client.db()
          const users = db.collection('users')
          const o = {
            db: users,
            username,
            local: isLocal,
            host: `${protocol}://${host}`,
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
        ctx.status = 500
        error(e)
        throw new Error(e)
      }
    } else {
      await next()
    }
  }
}

export {
  get,
  post,
  Hostmeta,
  Webfinger,
  wellknownHostmeta,
  wellknownWebfinger,
}
