const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger-output.json'; // Output file for the generated Swagger docs
const endpointsFiles = ['./routes/*.js']; // Path to route files

const doc = {
    info: {
        version: '1.0.0',
        title: 'API Documentation',
        description: 'API documentation for your project',
    },
    host: 'localhost:4000', // Change to host
    basePath: '/auth', // Base path
    tags: [
        {
            name: 'Auth',
            description: 'Authentication management',
        },
        {
            name: 'Media',
            description: 'Media management',
        },
    ],
    definitions: {
        User: {
            type: 'object',
            properties: {
                username: { type: 'string' },
                email: { type: 'string' },
                password: { type: 'string' },
                profilePic: { type: 'string' }, // URL to profile picture
                profilePic_id: { type: 'string' }, // Optional, if used
                notifications: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                            link: { type: 'string' },
                            read: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                        },
                    },
                },
                timestamp: { type: 'integer' },
            },
        },
        Media: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                fileType: { type: 'string', enum: ['video', 'audio'] },
                fileId: { type: 'string' }, // For file storage reference
                fileUrl: { type: 'string' }, // URL to file storage location
                views: { type: 'integer' },
                likes: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    },
};

// Generate Swagger docs
swaggerAutogen(outputFile, endpointsFiles, doc);
