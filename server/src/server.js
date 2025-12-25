// Load environment variables from .env file
// This allows us to store sensitive data like database passwords outside of code
// Make sure to create a .env file in the server directory with your configuration
require('dotenv').config();

// Import Node.js built-in http module to create an HTTP server
const http = require('http');

// Import mongoose library to connect to MongoDB database
const mongoose = require('mongoose');

// Import our Express app configuration
const app = require('./app');

// Import function to load planets data from CSV file
const { loadPlanetsData } = require('./models/planets.model');

// Get port number from environment variable, or use 8000 as default
// In production, you would set PORT=8000 (or your desired port) in your .env file
// This makes it easy to change ports without modifying code
const PORT = process.env.PORT || 8000;

// Get MongoDB connection string from environment variable
// IMPORTANT: Never commit your actual MongoDB password to Git!
// Always use environment variables for sensitive data
// Format: mongodb+srv://username:password@cluster.mongodb.net/database
// If MONGO_URL is not set, the server will fail (which is good - forces you to configure it)
const MONGO_URL = process.env.MONGO_URL;

// Check if MongoDB URL is provided
if (!MONGO_URL) {
    console.error('ERROR: MONGO_URL environment variable is not set!');
    console.error('Please create a .env file in the server directory with your MongoDB connection string.');
    console.error('Example: MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database');
    process.exit(1); // Exit the program if MongoDB URL is missing
}

// Create an HTTP server using our Express app
// This server will handle all incoming HTTP requests
const server = http.createServer(app);

// Set up event listeners for MongoDB connection
// These run automatically when mongoose connects or encounters errors

// This event fires once when MongoDB successfully connects
mongoose.connection.once('open', () => {
    console.log('✅ MongoDB connection ready!');
    console.log('   Database connected successfully.');
});

// This event fires if there's an error connecting to MongoDB
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
    console.error('   Please check your MONGO_URL in the .env file.');
});

// Main function to start the server
// This is an async function because connecting to MongoDB is asynchronous
async function startServer() {
    try {
        // Step 1: Connect to MongoDB database
        // We wait for this to complete before moving on
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URL);
        
        // Step 2: Load planets data from CSV file into database
        // This only runs if the database is empty (to avoid duplicates)
        console.log('🔄 Loading planets data...');
        await loadPlanetsData();

        // Step 3: Start listening for HTTP requests
        // Once this runs, the server is live and can accept requests
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}...`);
            console.log(`   API available at http://localhost:${PORT}`);
        });
    } catch (error) {
        // If anything goes wrong, log the error and exit
        console.error('❌ Failed to start server:', error);
        console.error('   Please check your configuration and try again.');
        process.exit(1); // Exit with error code 1
    }
}

startServer();

// Graceful shutdown handling
// This ensures the server closes database connections properly when shutting down
// Without this, you might get warnings about unclosed connections

// Flag to prevent multiple shutdown attempts
let isShuttingDown = false;

// Function to gracefully shut down the server
// "Graceful" means we close connections properly instead of just killing the process
function gracefulShutdown(signal) {
    // If we're already shutting down, don't do it again
    if (isShuttingDown) {
        console.log('⏳ Shutdown already in progress...');
        return;
    }
    
    // Mark that we're shutting down
    isShuttingDown = true;
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    // Step 1: Stop accepting new HTTP connections
    // This prevents new requests from coming in while we're shutting down
    server.close((err) => {
        if (err) {
            console.error('❌ Error closing HTTP server:', err);
        } else {
            console.log('✅ HTTP server closed');
        }
        
        // Step 2: Close MongoDB database connection
        // This ensures we don't leave database connections open
        mongoose.connection.close(false, (err) => {
            if (err) {
                console.error('❌ Error closing MongoDB connection:', err);
                process.exit(1); // Exit with error code
            } else {
                console.log('✅ MongoDB connection closed');
                console.log('✅ Graceful shutdown completed');
                process.exit(0); // Exit successfully
            }
        });
    });
    
    // Safety timeout: if shutdown takes too long, force exit
    // This prevents the server from hanging forever
    setTimeout(() => {
        console.error('⏰ Graceful shutdown timeout. Forcing exit...');
        process.exit(1);
    }, 10000); // 10 second timeout
}

// Register signal handlers for graceful shutdown
// These listen for system signals that indicate the server should shut down

// SIGTERM: Sent by process managers (like PM2) to request shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// SIGINT: Sent when user presses Ctrl+C in terminal
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unexpected errors that weren't caught by try-catch blocks
// These are errors that could crash the server if not handled

// Uncaught exceptions: Errors that weren't caught anywhere
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});

// Unhandled promise rejections: Promises that were rejected but not handled with .catch()
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Start the server!
// This is the entry point - when you run "npm start" or "node src/server.js", this runs
startServer();

