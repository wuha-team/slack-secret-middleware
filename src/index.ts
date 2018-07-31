/**
 * Slack signed request middleware
 * @author Wuha
 */

import * as contentType from 'content-type'
import { createHmac } from 'crypto'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import * as querystring from 'querystring'
import rawBody from 'raw-body'

/**
 * Default middleware executed when the Slack signing check fails.
 * It just returns 200, so that we don't give a hint to the requester that we actually spotted the error.
 */
export const defaultSignatureMismatchMiddleware: RequestHandler = (_req, res, _next) => {
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
    const parsedContentType = contentType.parse(req)
    const raw = await rawBody(
      req,
      {
        length: req.headers['content-length'],
        encoding: parsedContentType.parameters.charset,
      },
    )
    const timestamp = req.headers['x-slack-request-timestamp']

    const rawSignature = `${version}:${timestamp}:${raw}`
    const signature = `${version}=${createHmac('sha256', secret).update(rawSignature).digest('hex')}`

    // Parse request body for next middlewares
    if (parsedContentType.type === 'application/json') {
      req.body = JSON.parse(raw)
    }
    if (parsedContentType.type === 'application/x-www-form-urlencoded') {
      req.body = querystring.parse(raw.toString())
    }

    if (signature !== req.headers['x-slack-signature']) {
      signatureMismatchMiddleware(req, res, next)
    } else {
      next()
    }
  }
}
