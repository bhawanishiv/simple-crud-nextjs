import { withSwagger } from 'next-swagger-doc';

const swaggerHandler = withSwagger({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Simple CRUD APIs',
      version: '0.1.0',
    },
  },
  schemaFolders: ['src/interfaces'],
});
export default swaggerHandler();
