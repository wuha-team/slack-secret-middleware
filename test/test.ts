/* tslint:disable:no-unused-expression */
import { expect, request } from 'chai'
import express from 'express'
import { createSandbox } from 'sinon'

import { slackSignedRequestHandler } from '../src'

describe('slackSignedRequestHandler', () => {

  const sandbox = createSandbox()
  const signatureMismatchMiddleware = sandbox.stub().callsFake((_req, _res, next) => next())

  const app = express()
  app.post('/', slackSignedRequestHandler('SECRET', signatureMismatchMiddleware))
  const server = app.listen(8080)

  after('close server', () => {
    server.close()
  })

  afterEach('restoreSandbox', () => {
    sandbox.restore()
  })

  it('should not call the signatureMismatchMiddleware when the signature check suceeds', (done) => {
    request(server)
      .post('/')
      .set('X-Slack-Request-Timestamp', '1532955167')
      .set('X-Slack-Signature', 'v0=5adfc0fb4f2f5cca9da33b780b9272a5380e4785eb593f0ef7b06442c6b43d7a')
      .send({
        foo: 'bar',
      })
      .end(() => {
        expect(signatureMismatchMiddleware.called).to.be.false
        done()
      })
  })

  it('should call the signatureMismatchMiddleware when the signature check fails', (done) => {
    request(server)
      .post('/')
      .set('X-Slack-Request-Timestamp', '1532955167')
      .set('X-Slack-Signature', 'WRONG_SIGNATURE')
      .send({
        foo: 'bar',
      })
      .end(() => {
        expect(signatureMismatchMiddleware.called).to.be.true
        done()
      })
  })

})
