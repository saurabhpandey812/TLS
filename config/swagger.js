const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Profile API',
      version: '1.0.0',
      description: 'API documentation for user authentication and profile management',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'HTTP (local)' },
      { url: 'https://localhost:3001', description: 'HTTPS (local)' }
    ],
    tags: [
      {
        name: 'Profile',
        description: 'User profile operations'
      },
      {
        name: 'Auth',
        description: 'Authentication operations'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'], // Path to your route files for annotation
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;