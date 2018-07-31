/**
 * Slack signed request middleware
 * @author Wuha
 */

import * as contentType from 'content-type'
import { createHmac } from 'crypto'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import rawBody from 'raw-body'

/**
 * Default middleware executed when the Slack signing check fails.
 * It just returns 200, so that we don't give a hint to the requester that we actually spotted the error.
 */
export const defaultSignatureMismatchMiddleware: RequestHandler = (_req, res, _next) => {
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
  return async (req: Request, res: Response, next: NextFunction) => {
    const raw = await rawBody(
      req,
      {
        length: req.headers['content-length'],
        encoding: contentType.parse(req).parameters.charset,
      },
    )
    const timestamp = req.headers['x-slack-request-timestamp']

    const rawSignature = `${version}:${timestamp}:${raw}`
    const signature = `${version}=${createHmac('sha256', secret).update(rawSignature).digest('hex')}`

    req.body = JSON.parse(raw)

    if (signature !== req.headers['x-slack-signature']) {
      signatureMismatchMiddleware(req, res, next)
    } else {
      next()
    }
  }
}
