import { createApplication } from "@specific-dev/framework";
import * as schema from './db/schema/schema.js';

// Import route registration functions
// import { registerUserRoutes } from './routes/users.js';

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Health check route
app.fastify.get('/', {
  schema: {
    description: 'Health check endpoint',
    tags: ['health'],
    response: {
      200: {
        description: 'Service is healthy',
        type: 'object',
        properties: {
          status: { type: 'string' },
        },
      },
    },
  },
}, async () => {
  app.logger.info('Health check');
  return { status: 'ok' };
});

// Register routes - add your route modules here
// IMPORTANT: Always use registration functions to avoid circular dependency issues
// registerUserRoutes(app);

await app.run();
app.logger.info('Application running');
