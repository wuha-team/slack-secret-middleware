# Slack Secret Middleware

> DEPRECATED: Use the official [Slack Events API adapter](https://github.com/slackapi/node-slack-events-api) library.

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]

Express middleware to check the authenticity of incoming [Slack signed requests](https://api.slack.com/docs/verifying-requests-from-slack), as part of the [Events API](https://api.slack.com/events-api).

## Installation

```bash
npm i slack-secret-middleware
```

## Usage

Find the **Signing Secret** of your Slack app in your app settings.

Add the middleware to the route receiving the Slack events:

```ts
import { slackSignedRequestHandler } from 'slack-secret-middleware'

app.post(
  '/events',
  slackSignedRequestHandler('SLACK_SIGNING_SECRET'),
  // The request is authentic, do your own logic
  (req, res, next) => {
    // `req.body` contains the parsed JSON of the event
    res.status(200).json(req.body)
  }
)
```

### Custom signature mismatch middleware

By default, when the signature check fails, it just returns a response with status 200. If you want to do custom logic when this happens, you can provide your own middleware as a second parameter of the `slackSignedRequestHandler`:

```ts
slackSignedRequestHandler(
  'SLACK_SIGNING_SECRET',
  (req, res, next) => {
    console.error('Wrong signature', { body: req.body, headers: req.headers })
    res.sendStatus(500)
  }
)
```

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/slack-secret-middleware.svg
[npm-url]: https://npmjs.org/package/slack-secret-middleware
[travis-image]: https://travis-ci.org/wuha-team/slack-secret-middleware.svg?branch=master
[travis-url]: https://travis-ci.org/wuha-team/slack-secret-middleware
[coveralls-image]: https://coveralls.io/repos/github/wuha-team/slack-secret-middleware/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/wuha-team/slack-secret-middleware?branch=master
[downloads-image]: https://img.shields.io/npm/dm/slack-secret-middleware.svg
[downloads-url]: https://npmjs.org/packageslack-secret-middleware