const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Title',
      version: '1.0.0',
      description: 'API documentation with JWT authentication',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'HTTP (local)' },
      { url: 'https://localhost:3001', description: 'HTTPS (local)' }
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