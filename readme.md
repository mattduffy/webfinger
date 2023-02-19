## Webfinger Middleware for Koa

This package for Node.js exports a middleware function for Koa applications that provides a Webfinger ([RFC 7033](https://www.rfc-editor.org/rfc/rfc7033#page-14)) URL, ```/.well-known/webfinger?resource={uri}```.  The default use for this package is to supply a Mastodon-compatible webfinger acct: query, which can lookup user accounts on the local server or a remote server, if the hostname portion of the acct: param differs.

### Using Webfinger

```bash
npm install --save @mattduffy/webfinger
```

```javascript
import { wellknownWebfinger } from '@mattduffy/webfinger'
// add to exisiting koa app instance
const options = {
  // TODO
  // mongodb = <mongodbClient|null>,
  // redis = <redisClient|null>,
  // hostname = example.org,
}
app.use(wellknownWebfinger(options, app))
```

To lookup a user's profile on the website https://social.example.org, sending an HTTP GET request to the URL:
```javascript
https://social.example.org/.well-known/webfinger?resource=acct:@user123@social.example.org
```
could return the following output (if user123 exists):
```
HTTP/1.1 200 OK
Content-Length: 683
Content-Type: application/json; charset=utf-8
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS
Vary: Origin

{
  subject: "acct:user123@social.example.org",
  aliases: [
    "http://social.example.org/@user123",
    "http://social.example.org/user/user123"
  ],
  links: [
    {
      rel: "http://webfinger.net/rel/profile-page",
      type: "text/html; charset=utf-8",
      href: "http://social.example.org/@user123"
    },
    {
      rel: "http://webfinger.net/rel/avatar",
      type: "image",
      href: "http://192.168.1.252:3333/i/accounts/avatars/missing.png"
    },
    {
      rel: "self",
      type: "application/activity+json",
      href: "http://social.example.org/user/user123"
    },
    {
      rel: "http://ostatus.org/schema/1.0/subscribe",
      template: "http://social.example.org/authorize_interaction?uri={uri}"
    }
  ]
}
```
If the ```resource``` query parameter is missing or malformed, the server will return 
```
HTTP/1.1 400 Bad Request
Content-Type: text/plain; charset=utf-8
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS
Vary: Origin

Bad request
```

If there is on user account found, the server will return 
```
HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS
Vary: Origin

user123 not found
```


### Webfinger 
It is possible to directly import the Webfinger class that is used by the middleware function, to manually make webfinger queries.  Once an instance has been created, use the ```finger()``` method to make the query.  This is an **Async/Await** method.
```javascript
import { Webfinger } from '@mattduffy/webfinger'
const options = {
  // fill in the required options needed to make queries...
}
const web = new Webfinger(options)
const user1 = await web.finger()
```

### Host-Meta
Host-Meta does not seem to really be much of a thing anymore.  Mastodon might be the main consumer of host-meta queries, but even then, I don't think it is completely required.  In order to provide a Mastodon-compatible version of Webfinger, this package also includes a Koa appliation middlware function that is able to return either ```xrd+xml``` or ```jrd+json``` responses.
```javascript
import { wellknownHostmeta } from '@mattduffy/webfinger'
app.use(wellknownHostmeta({}, app))
```
An HTTP GET request to ```https://social.example.org/.well-known/host-meta``` will return the following output:
```javascript
HTTP/1.1 200 OK
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS
Access-Control-Allow-Origin: *
Vary: Origin

<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Link rel="lrdd" template="https:///social.example.org/.well-known/webfinger?resource={uri}"/>
</XRD>
```
But, really, nobody should be using XML at this point, so the better option is to request JSON output:
```https://social.example.org/.well-known/host-meta.json```
```javascript
HTTP/1.1 200 OK
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept
Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Vary: Origin

{
    "links": [
        {
            "rel": "lrdd",
            "template": "https:///social.example.org/.well-known/webfinger?resource={uri}"
        }
    ]
}
```

### Get
The Webfinger class uses a separatly exported function called ```get()```.  This is an **Async/Await** function wrapping the native Node http or https classes.
```javascript
import { get } from '@mattduffy/webfinger'
const url = 'https://social.example.org/.well-known/webfinger?resource=acct:@user123@mastodon.social'
const user = await get(url)
```
Output from the ```get()``` function is an object literal in the form:
```javascript
{
  content: {...},
  headers: {...},
  statusCode: <HTTP Code>,
  statusMessage: <HTTP Status Message>,
 }
 ```
