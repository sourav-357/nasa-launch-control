// Import Express framework
// Express makes it easy to create web servers and APIs
const express = require('express');

// Import CORS middleware
// CORS (Cross-Origin Resource Sharing) allows the frontend to make requests to this API
// Without CORS, browsers block requests from different origins (like localhost:3000 to localhost:8000)
const cors = require('cors');

// Import path module (built into Node.js)
// Used to work with file and directory paths
const path = require('path');

// Import morgan middleware for logging HTTP requests
// This helps with debugging by showing which requests are being made
const morgan = require('morgan');

// Import our route handlers
// These files contain the logic for handling different API endpoints
const planetsRouter = require('./routes/planets/planets.router');
const launchesRouter = require('./routes/launches/launches.router');

// Create an Express application
// This is the main app object that we'll configure
const app = express();

// Configure CORS (Cross-Origin Resource Sharing)
// This tells the browser which websites are allowed to make requests to our API
// In development, we allow requests from localhost:3000 (where React app runs)
// In production, you should set CLIENT_URL in your .env file to your actual frontend domain
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(cors({
    origin: CLIENT_URL, // Only allow requests from this origin
}));

// Morgan middleware for logging HTTP requests
// This logs every request to the console (useful for debugging)
// Uncomment the line below if you want to see all API requests in the console
// app.use(morgan('combined'));

// Middleware to parse JSON request bodies
// When the frontend sends JSON data (like when creating a launch), this converts it to a JavaScript object
// Without this, req.body would be undefined
app.use(express.json());

// Serve static files from the public directory
// Static files are files that don't change (like images, CSS, JavaScript)
// In production, the built React app is in the public directory
// This allows users to access files like /img/background.jpg
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback route for client-side routing
// React Router handles routing on the frontend, but when you refresh the page or type a URL directly,
// the browser makes a request to the server. This route serves the React app's index.html
// so React Router can take over and show the correct page
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// API Routes
// These routes handle requests to our API endpoints
// When someone visits /planets, the planetsRouter handles it
// When someone visits /launches, the launchesRouter handles it

// Mount the planets router at /planets
// This means GET /planets will be handled by planetsRouter
app.use('/planets', planetsRouter);

// Mount the launches router at /launches
// This means GET /launches, POST /launches, DELETE /launches/:id will be handled by launchesRouter
app.use('/launches', launchesRouter);

// Export the app so it can be used in server.js
// This is how we share the Express app with other files
module.exports = app;

