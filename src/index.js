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

// const error = Debug('webfinger:main:error')
// const log = Debug('webfinger:main:log')

// const webfinger = new Webfinger()

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
        const re = new RegExp(`^acct:([^\\s][A-Za-z0-9_-]{2,30})@${ctx.app.domain}$`)
        const username = re.exec(ctx.request.query.resource)
        if (!ctx.request.query.resource || !username) {
          err('Missing resource query parameter.')
          ctx.status = 400
          ctx.type = 'text/plain; charset=utf-8'
          ctx.body = 'Bad request'
          // throw new Error('Missing resource query parameter.')
        }
        const db = ctx.state.mongodb.client.db()
        const users = db.collection('users')
        const foundUser = await users.findOne({ username: username[1] })
        if (!foundUser) {
          ctx.status = 404
          ctx.type = 'text/plain; charset=utf-8'
          ctx.body = `${ctx.request.query.resource} not found`
        } else {
          const host = `https://${ctx.app.domain}`
          const finger = {
            subject: ctx.request.query.resource,
            aliases: [],
            links: [],
          }
          finger.aliases.push(`${host}/@${foundUser.username}`)
          finger.aliases.push(`${host}/users/${foundUser.username}`)
          finger.links.push({
            rel: 'http://webfinger.net/rel/profile-page',
            type: 'text/html',
            href: `${host}/@${foundUser.username}`,
          })
          finger.links.push({
            rel: 'http://webfinger.net/rel/avatar',
            type: 'image',
            href: username.avatar || `${host}/i/favicon.ico`,
          })
          finger.links.push({
            rel: 'self',
            type: 'application/activity+json',
            href: `${host}/users/${foundUser.username}`,
          })
          ctx.status = 200
          ctx.type = 'application/jrd+json; charset=utf-8'
          ctx.body = finger
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
  // webfinger,
  wellknownWebfinger,
}
