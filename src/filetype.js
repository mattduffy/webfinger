/**
 * @module @mattduffy/webfinger
 * @author Matthew Duffy <mattduffy@gmail.com>
 * @file src/filetype.js A simply utility function to get the mime type of a file.
 */

import path from 'node:path'
import { promisify } from 'node:util'
import { exec } from 'node:child_process'
import Debug from 'debug'

const error = Debug('webfinger:filetype_error')
const log = Debug('webfinger:filetype_log')
const cmd = promisify(exec)

export default async function filetype(pathToFile) {
  const o = {
    type: null,
    err: null,
    msg: null,
    cmd: null,
  }
  if (pathToFile === undefined) {
    o.err = 'No file path provided.'
  } else {
    try {
      const filepath = path.resolve(pathToFile)
      log(filepath)
      const cmdString = `file --brief --mime-type ${filepath}`
      o.cmd = cmdString
      const result = await cmd(cmdString)
      if (/^cannot open/.test(result.stdout)) {
        o.err = result.stdout.trim()
        o.msg = 'failed'
      } else {
        o.type = result.stdout.trim()
        o.msg = 'success'
      }
    } catch (e) {
      error(e)
      o.err = e
      o.msg = e.message
    }
  }
  return o
}
