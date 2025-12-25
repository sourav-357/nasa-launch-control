// Import the Launch model (MongoDB schema) so we can interact with launches in the database
const Launch = require('./launches.mongo');

// Import the Planet model to validate that target planets exist
const Planet = require('./planets.mongo');

// Default customers for all new launches
// These are the organizations that are paying for the mission
// Every new launch automatically gets these customers assigned
const DEFAULT_CUSTOMERS = ['Zero to Mastery', 'NASA'];

// Function to get the highest flight number currently in the database
// This is used to auto-increment flight numbers for new launches
// Returns: The highest flight number, or 100 if database is empty
async function getLatestFlightNumber() {
    // Find one launch document, sorted by flightNumber in descending order
    // This gives us the launch with the highest flight number
    // .sort('-flightNumber') means sort by flightNumber descending (highest first)
    const latestLaunch = await Launch
        .findOne()                    // Find one document (not all)
        .sort('-flightNumber');       // Sort by flightNumber descending
    
    // If no launches exist yet (database is empty), start from 100
    // We start from 100 to leave room for historical SpaceX data (if we add it later)
    if (!latestLaunch) {
        return 100;
    }
    
    // Return the flight number of the latest launch
    // The next launch will be this number + 1
    return latestLaunch.flightNumber;
}

// Function to check if a launch with a specific flight number exists
// This is used to validate that a launch exists before trying to abort it
// Parameters:
//   - launchId: The flight number to check (e.g., 100, 101, 102)
// Returns: The launch document if found, or null if not found
async function existsLaunchWithId(launchId) {
    // Find one launch with the matching flight number
    // Returns the launch object if found, or null if not found
    return await Launch.findOne({
        flightNumber: launchId
    });
}

// Function to get all launches from the database
// This is used by the /launches API endpoint
// Parameters:
//   - skip: Number of documents to skip (for pagination) - not currently used
//   - limit: Maximum number of documents to return (for pagination) - not currently used
// Returns: An array of all launch objects, sorted by flight number
async function getAllLaunches(skip, limit) {
    // Query the database for all launches
    return await Launch
        .find({}, { '_id': 0, '__v': 0 })  // Find all, exclude MongoDB internal fields
        .sort({ flightNumber: 1 })          // Sort by flightNumber ascending (100, 101, 102...)
        .skip(skip)                         // Skip first N documents (for pagination)
        .limit(limit);                      // Return maximum N documents (for pagination)
    // Note: skip and limit are included for future pagination support
    // Currently, we pass undefined for both, which means "get all launches"
}

// Helper function to save or update a launch in the database
// This uses "upsert" which means "update if exists, insert if doesn't exist"
// Parameters:
//   - launch: A launch object with all the launch data
async function saveLaunch(launch) {
    // findOneAndUpdate() finds a document and updates it, or creates it if it doesn't exist
    await Launch.findOneAndUpdate(
        { flightNumber: launch.flightNumber },  // Find a launch with this flight number
        launch,                                 // Update it with this data (or create if not found)
        { upsert: true }                        // upsert: true means "create if doesn't exist"
    );
    // This is useful because we can call this function whether the launch exists or not
}

// Function to create a new launch
// This is called when the frontend submits the launch form
// Parameters:
//   - launch: An object with mission, rocket, launchDate, and target
// Returns: The created launch object with flight number and default values
async function addNewLaunch(launch) {
    // Step 1: Get the latest flight number and add 1 to get the next number
    // This ensures each launch gets a unique, sequential flight number
    const newFlightNumber = await getLatestFlightNumber() + 1;
    
    // Step 2: Create a new launch object with all required fields
    // Object.assign() copies all properties from 'launch' and adds/overwrites with the second object
    const newLaunch = Object.assign(launch, {
        flightNumber: newFlightNumber,      // Auto-assigned sequential number
        customers: DEFAULT_CUSTOMERS,       // Default customers (Zero to Mastery, NASA)
        upcoming: true,                     // New launches are always upcoming
        success: true,                      // New launches are assumed successful (until aborted)
    });
    
    // Step 3: Save the launch to the database
    await saveLaunch(newLaunch);
    
    // Step 4: Return the created launch (so the API can send it back to the frontend)
    return newLaunch;
}

// Function to abort (cancel) a launch
// This doesn't delete the launch, just marks it as aborted
// Parameters:
//   - launchId: The flight number of the launch to abort
// Returns: true if the launch was successfully aborted, false otherwise
async function abortLaunchById(launchId) {
    // Use updateOne() to update a single document in the database
    // First parameter: find the launch with this flight number
    // Second parameter: update it with these new values
    const aborted = await Launch.updateOne(
        { flightNumber: launchId },  // Find launch with this flight number
        {
            upcoming: false,         // Mark as not upcoming (it's been canceled)
            success: false,           // Mark as unsuccessful (it was aborted)
        }
    );
    
    // updateOne() returns an object with information about the update
    // modifiedCount tells us how many documents were actually updated
    // If modifiedCount is 1, the launch was found and updated (success)
    // If modifiedCount is 0, the launch wasn't found (failure)
    return aborted.modifiedCount === 1;
}

// Export all functions so other files can import and use them
// When you do: const { getAllLaunches } = require('./launches.model');
// You can then call getAllLaunches() in that file
module.exports = {
    getAllLaunches,        // Get all launches from database
    addNewLaunch,          // Create a new launch
    existsLaunchWithId,    // Check if a launch exists
    abortLaunchById,       // Abort a launch
};

