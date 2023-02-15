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
  const err = Debug('webfinger:wellknown_error')
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
    err('Required app instance not provided')
    throw new Error('Required app instance not provided')
  }
  log('Adding the /.well-known/webfinger route to the app.')

  return async function webfinger(ctx, next) {
    await next()
    if (!ctx.state.mongodb) {
      err('Missing db connection')
      ctx.status = 500
      ctx.type = 'text/plain; charset=utf-8'
      // throw new Error('Missing db connection')
    }

    if (/^\/\.well-known\/webfinger/.test(ctx.request.path)) {
      try {
        // const re = new RegExp(`^acct:([^\\s][A-Za-z0-9_-]{2,30})(?:@)?(${ctx.app.domain}|${process.env.HOST})?$`)
        const re = new RegExp(`^acct:([^\\s][A-Za-z0-9_-]{2,30})(?:@)?([^\\s].*)?$`)
        const username = re.exec(ctx.request.query?.resource)
        if (!ctx.request.query.resource || !username) {
          err('Missing resource query parameter.')
          ctx.status = 400
          ctx.type = 'text/plain; charset=utf-8'
          ctx.body = 'Bad request'
          // throw new Error('Missing resource query parameter.')
        } else {
          log(username)
          const host = process.env.HOST
          const domain = process.env.DOMAIN_NAME
          const localAcct = new RegExp(`(${host}|${domain})`)
          const isLocal = localAcct.test(username[2])
          let found
          if (!isLocal) {
            // webfinger a request to a remote server
            const remoteFinger = `https://${username[2]}/.well-known/webfinger?resource=${username.input}`
            err(remoteFinger)
            const finger = await get(remoteFinger)
            if (finger.statusCode === 200) {
              found = finger.content
            } else {
              found = false
            }
          } else {
            const db = ctx.state.mongodb.client.db()
            const users = db.collection('users')
            const finger = new Webfinger({ db: users, username: username[1], local: isLocal })
            found = await finger.finger()
          }
          if (!found) {
            ctx.status = 404
            ctx.type = 'text/plain; charset=utf-8'
            ctx.body = `${username[1]} not found`
          }
          ctx.status = 200
          ctx.type = 'application/jrd+json; charset=utf-8'
          ctx.body = found
        }
      } catch (e) {
        ctx.status = 500
        err(e)
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
