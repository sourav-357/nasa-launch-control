// Import functions from the launches model
// These functions handle the database operations (getting, creating, updating launches)
const { 
    getAllLaunches,        // Get all launches from database
    addNewLaunch,          // Create a new launch
    existsLaunchWithId,    // Check if a launch exists
    abortLaunchById,       // Abort a launch
} = require('../../models/launches.model');

// Controller function for GET /launches endpoint
// This handles requests to get all launches (both upcoming and past)
// Parameters:
//   - req: Request object (contains info about the HTTP request)
//   - res: Response object (used to send data back to the client)
async function httpGetAllLaunches(req, res) {
    // Get all launches from the database
    // This is an async operation, so we use await
    const launches = await getAllLaunches();
    
    // Send the launches back to the client as JSON
    // Status 200 means "OK" (success)
    // .json() converts the JavaScript array to JSON format
    return res.status(200).json(launches);
}

// Controller function for POST /launches endpoint
// This handles requests to create a new launch
// The frontend sends launch data in the request body
async function httpAddNewLaunch(req, res) {
    // Get the launch data from the request body
    // When the frontend sends JSON data, Express parses it and puts it in req.body
    const launch = req.body;

    // Input validation - check that all required fields are present
    // We need mission, rocket, launchDate, and target to create a launch
    if (!launch.mission || !launch.rocket || !launch.launchDate || !launch.target) {
        // If any field is missing, send an error response
        // Status 400 means "Bad Request" (the client sent invalid data)
        return res.status(400).json({
            error: 'Missing required launch property'
        });
    }

    // Convert the launch date from string to Date object
    // The frontend sends dates as strings (e.g., "2024-12-31")
    // MongoDB needs Date objects to store dates properly
    launch.launchDate = new Date(launch.launchDate);
    
    // Validate that the date is actually valid
    // If you pass an invalid date string to new Date(), it creates an "Invalid Date"
    // isNaN() checks if the date is invalid (NaN = Not a Number)
    if (isNaN(launch.launchDate)) {
        // If the date is invalid, send an error response
        return res.status(400).json({
            error: 'Invalid launch date',
        });
    }

    // Try to create the launch in the database
    try {
        // addNewLaunch() will:
        //   1. Auto-assign a flight number
        //   2. Set default customers
        //   3. Mark as upcoming and successful
        //   4. Save to database
        const savedLaunch = await addNewLaunch(launch);
        
        // If successful, send the created launch back to the client
        // Status 201 means "Created" (new resource was successfully created)
        return res.status(201).json(savedLaunch);
    } catch (error) {
        // If something goes wrong (database error, etc.), catch it here
        console.error('❌ Error adding launch:', error);
        
        // Send an error response to the client
        // Status 500 means "Internal Server Error" (something went wrong on the server)
        return res.status(500).json({
            error: 'Failed to add launch'
        });
    }
}

// Controller function for DELETE /launches/:id endpoint
// This handles requests to abort (cancel) a launch
// The :id in the URL is the flight number (e.g., DELETE /launches/100)
async function httpAbortLaunch(req, res) {
    // Get the flight number from the URL parameters
    // req.params.id gets the :id part from the URL
    // Convert it to a number because URLs are strings by default
    const launchId = Number(req.params.id);

    // Step 1: Check if the launch exists before trying to abort it
    // This prevents errors if someone tries to abort a launch that doesn't exist
    const existsLaunch = await existsLaunchWithId(launchId);
    if (!existsLaunch) {
        // If launch doesn't exist, send an error response
        // Status 404 means "Not Found" (the resource doesn't exist)
        return res.status(404).json({
            error: 'Launch not found',
        }); 
    }

    // Step 2: Try to abort the launch
    // abortLaunchById() marks the launch as not upcoming and unsuccessful
    const aborted = await abortLaunchById(launchId);
    
    // Step 3: Check if the abort was successful
    // abortLaunchById() returns true if it worked, false if it didn't
    if (!aborted) {
        // If abort failed (shouldn't happen if launch exists, but just in case)
        return res.status(400).json({
            error: 'Launch not aborted'
        });
    }

    // Step 4: Send success response
    // Status 200 means "OK" (success)
    return res.status(200).json({
        ok: true  // Simple success indicator
    });
}

module.exports = {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpAbortLaunch,
}

