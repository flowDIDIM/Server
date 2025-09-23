import { Hono } from 'hono'
import {
  describeRoute,
  openAPIRouteHandler,
  resolver,
  validator,
} from 'hono-openapi'
import { z } from 'zod'
import { Scalar } from '@scalar/hono-api-reference'

const app = new Hono()

const querySchema = z.object({
  name: z.optional(z.string()),
})

const responseSchema = z.string()

app.get(
  '/',
  describeRoute({
    description: 'Say hello to the user',
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'text/plain': { schema: resolver(responseSchema) },
        },
      },
    },
  }),
  validator('query', querySchema),
  c => {
    const query = c.req.valid('query')
    return c.text(`Hello ${query?.name ?? 'Hono'}!`)
  },
)

app.get(
  '/openapi',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Hono API',
        version: '1.0.0',
        description: 'Greeting API',
      },
      servers: [{ url: 'http://localhost:3000', description: 'Local Server' }],
    },
  }),
)

// Use the middleware to serve the Scalar API Reference at /scalar
app.get('/scalar', Scalar({ url: '/openapi' }))

export default app
