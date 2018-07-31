/* tslint:disable:no-unused-expression */
//import * as bodyParser from 'body-parser'
import { expect, request } from 'chai'
import express from 'express'
import { createSandbox } from 'sinon'

import * as slackSecretMiddleware from '../src'

describe('slackSignedRequestHandler', () => {

  const sandbox = createSandbox()
  const successMiddlewareStub = sandbox.stub().callsFake(
    (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
      next()
    },
  )
  const signatureMismatchMiddlewareSpy = sandbox.spy(slackSecretMiddleware, 'defaultSignatureMismatchMiddleware')

  const app = express()
  app.post('/', slackSecretMiddleware.slackSignedRequestHandler('SECRET'), successMiddlewareStub)
  const server = app.listen(8080)

  after('close server', () => {
    server.close()
  })

  afterEach('reset spy and stub', () => {
    successMiddlewareStub.resetHistory()
    signatureMismatchMiddlewareSpy.resetHistory()
  })

  describe('application/json content type', () => {

    it('should call the successMidleware with the parsed JSON when the signature check succeeds', (done) => {
      request(server)
        .post('/')
        .set('X-Slack-Request-Timestamp', '1532955167')
        .set('X-Slack-Signature', 'v0=5adfc0fb4f2f5cca9da33b780b9272a5380e4785eb593f0ef7b06442c6b43d7a')
        .send({
          foo: 'bar',
        })
        .end(() => {
          expect(successMiddlewareStub.called).to.be.true
          expect(successMiddlewareStub.args[0][0].body).to.deep.equal({ foo: 'bar' })

          expect(signatureMismatchMiddlewareSpy.called).to.be.false
          done()
        })
    })

    it('should call the signatureMismatchMiddleware with the parsed JSON when the signature check fails', (done) => {
      request(server)
        .post('/')
        .set('X-Slack-Request-Timestamp', '1532955167')
        .set('X-Slack-Signature', 'WRONG_SIGNATURE')
        .send({
          foo: 'bar',
        })
        .end((_err, res) => {
          expect(successMiddlewareStub.called).to.be.false

          expect(signatureMismatchMiddlewareSpy.called).to.be.true
          expect(signatureMismatchMiddlewareSpy.args[0][0].body).to.deep.equal({ foo: 'bar' })

          expect(res.status).to.equal(200)
          done()
        })
    })

  })

  describe('application/x-www-form-urlencoded content type', () => {

    it('should call the successMidleware with the parsed data when the signature check succeeds', (done) => {
      request(server)
        .post('/')
        .set('X-Slack-Request-Timestamp', '1532955167')
        .set('X-Slack-Signature', 'v0=b6e5b4a912927e9064df7d6e4c96dd702216abe90af5059e02b3bf4b5eff5703')
        .type('form')
        .send({
          foo: 'bar',
        })
        .end(() => {
          expect(successMiddlewareStub.called).to.be.true
          expect(successMiddlewareStub.args[0][0].body).to.deep.equal({ foo: 'bar' })

          expect(signatureMismatchMiddlewareSpy.called).to.be.false
          done()
        })
    })

    it('should call the signatureMismatchMiddleware with the parsed data when the signature check fails', (done) => {
      request(server)
        .post('/')
        .set('X-Slack-Request-Timestamp', '1532955167')
        .set('X-Slack-Signature', 'WRONG_SIGNATURE')
        .type('form')
        .send({
          foo: 'bar',
        })
        .end((_err, res) => {
          expect(successMiddlewareStub.called).to.be.false

          expect(signatureMismatchMiddlewareSpy.called).to.be.true
          expect(signatureMismatchMiddlewareSpy.args[0][0].body).to.deep.equal({ foo: 'bar' })

          expect(res.status).to.equal(200)
          done()
        })
    })

  })

})
