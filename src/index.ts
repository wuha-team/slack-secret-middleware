/**
 * Slack signed request middleware
 * @author Wuha
 */

import * as bodyParser from 'body-parser'
import { compose } from 'compose-middleware'
import { createHmac } from 'crypto'
import { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Structure of an Express request in which we add the raw request buffer.
 */
interface RequestRawBody extends Request {
  rawBody: Buffer
}

/**
 * Default middleware executed when the Slack signing check fails.
 * It just returns 200, so that we don't give a hint to the requester that we actually spotted the error.
 */
const defaultSignatureMismatchMiddleware: RequestHandler = (_req, res, _next) => {
  // tslint:disable-next-line:no-console
  console.error('Slack signature mismatch')
  res.sendStatus(200)
}

/**
 * Creates a middleware that checks the signing of the Slack request to tell if it truly comes from Slack.
 * @param secret The Slack signing secret of the app.
 * @param signatureMismatchMiddleware Middleware executed when the Slack signing check fails.
 * @param version The Slack signing version. Default to `v0`.
 */
export const slackSignedRequestHandler = (
  secret: string,
  signatureMismatchMiddleware: RequestHandler = defaultSignatureMismatchMiddleware,
  version: string = 'v0',
): RequestHandler => {
  return compose(
    bodyParser.json({
      verify: (req, _res, buf) => {
        (<RequestRawBody> req).rawBody = buf
      },
    }),
    (req: Request, res: Response, next: NextFunction) => {
      const rawBody = (<RequestRawBody> req).rawBody
      const timestamp = req.headers['x-slack-request-timestamp']

      const rawSignature = `${version}:${timestamp}:${rawBody}`
      const signature = `${version}=${createHmac('sha256', secret).update(rawSignature).digest('hex')}`

      if (signature !== req.headers['x-slack-signature']) {
        signatureMismatchMiddleware(req, res, next)
      } else {
        next()
      }
    },
  )
}
