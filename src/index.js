/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/index.js The Webfinger class definition file.
 */

import Debug from 'debug'
import get from './get.js'
import post from './post.js'
import Webfinger from './webfinger.js'
// import Hostmeta from './host-meta.js'

function wellknownWebfinger(options, application) {
  const error = Debug('webfinger:wellknown_error')
  const log = Debug('webfinger:wellknown_log')
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
    await next()
    if (!ctx.state.mongodb) {
      error('Missing db connection')
      ctx.status = 500
      ctx.type = 'text/plain; charset=utf-8'
      // throw new Error('Missing db connection')
    }

    if (/^\/\.well-known\/webfinger/.test(ctx.request.path)) {
      try {
        const re = new RegExp(`^acct:([^\\s][A-Za-z0-9_-]{2,30})(?:@)?([^\\s].*)?$`)
        const username = re.exec(ctx.request.query?.resource)
        if (!ctx.request.query.resource || !username) {
          error('Missing resource query parameter.')
          ctx.status = 400
          ctx.type = 'text/plain; charset=utf-8'
          ctx.body = 'Bad request'
        } else {
          // log(username)
          const host = process.env.HOST
          const domain = process.env.DOMAIN_NAME
          const localAcct = new RegExp(`(${host}|${domain})`)
          const isLocal = localAcct.test(username[2])
          const db = ctx.state.mongodb.client.db()
          const users = db.collection('users')
          const o = { db: users, username, local: isLocal }
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
    }
  }
}

export {
  get,
  post,
  Webfinger,
  wellknownWebfinger,
}
