// Import csv-parse library to read and parse CSV files
// CSV (Comma-Separated Values) is a file format where data is separated by commas
const { parse } = require('csv-parse');

// Import path module (built into Node.js) to work with file paths
const path = require('path');

// Import fs module (built into Node.js) to read files from the filesystem
const fs = require('fs');

// Import the Planet model (MongoDB schema) so we can save planets to the database
const Planet = require('./planets.mongo');

// Temporary storage for CSV parsing
// This array stores all rows from the CSV file as we read them
// We don't actually need this after saving to DB, but it's useful for debugging
const results = [];

// Function to check if a planet is habitable (could support life)
// This uses scientific criteria based on real research about what makes a planet habitable
// Parameters:
//   - planet: An object representing one row from the CSV file
// Returns: true if the planet meets all criteria, false otherwise
function isHabitablePlanet(planet) {
  // Criteria 1: Planet must be CONFIRMED (not a false positive or candidate)
  // This ensures we only use planets that scientists are confident exist
  const isConfirmed = planet['koi_disposition'] === 'CONFIRMED';
  
  // Criteria 2: Stellar flux (koi_insol) must be between 0.36 and 1.11
  // Stellar flux = how much energy the planet receives from its star
  // 0.36 to 1.11 means the planet gets similar energy to Earth (not too hot, not too cold)
  // This is the "Goldilocks zone" - just right for liquid water
  const hasRightStellarFlux = planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11;
  
  // Criteria 3: Planetary radius (koi_prad) must be less than 1.6 times Earth's radius
  // Planets that are too large might have too much gravity or be gas giants
  // 1.6 times Earth's radius is the maximum size for a potentially rocky, habitable planet
  const hasRightSize = planet['koi_prad'] < 1.6;
  
  // Planet is habitable only if it meets ALL three criteria
  return isConfirmed && hasRightStellarFlux && hasRightSize;
}

// Function to load planets from CSV file into the database
// This runs when the server starts up
// It reads the NASA Kepler data CSV file, filters for habitable planets, and saves them to MongoDB
async function loadPlanetsData() {
    // Return a Promise so we can use await when calling this function
    return new Promise(async (resolve, reject) => {
        // Array to store names of habitable planets as we find them
        const habitablePlanets = [];

        // Get the path to the CSV file
        // __dirname = current directory (server/src/models)
        // We go up two levels (..) to get to server/, then into data/ folder
        const csvFilePath = path.join(__dirname, '..', '..', 'data', 'kepler_data.csv');

        // Create a read stream to read the CSV file
        // Streams are used for large files - they read data in chunks instead of loading everything into memory
        // This is more memory-efficient for large CSV files
        fs.createReadStream(csvFilePath)
            // Pipe the file stream through the CSV parser
            // This converts the CSV text into JavaScript objects
            .pipe(parse({
                comment: '#',   // Lines starting with # are comments, ignore them
                columns: true,  // Use the first row as column names (creates objects with named properties)
            }))
            // Event: 'data' fires for each row in the CSV file
            .on('data', (data) => {
                // Store the raw data (useful for debugging)
                results.push(data);
                
                // Check if this planet meets our habitable criteria
                if (isHabitablePlanet(data)) {
                    // Get the planet name
                    // kepler_name is more readable (e.g., "Kepler-442 b")
                    // kepoi_name is the internal ID (e.g., "K00001.01")
                    // Use kepler_name if available, otherwise fall back to kepoi_name
                    const planetName = data.kepler_name || data.kepoi_name;
                    
                    // Only add the planet if it has a name
                    if (planetName) {
                        habitablePlanets.push(planetName);
                    }
                }
            })
            // Event: 'error' fires if something goes wrong reading the file
            .on('error', (err) => {
                console.error('❌ Error reading CSV file:', err);
                reject(err); // Reject the Promise with the error
            })
            // Event: 'end' fires when we've finished reading the entire file
            .on('end', async () => {
                try {
                    // Step 1: Clear existing planets from database
                    // This prevents duplicates if we run the server multiple times
                    // deleteMany({}) with empty object means "delete all documents"
                    await Planet.deleteMany({});
                    
                    // Step 2: Convert planet names to objects that match our schema
                    // Our Planet schema expects objects with a keplerName property
                    const planetsToSave = habitablePlanets.map(planetName => ({
                        keplerName: planetName
                    }));
                    
                    // Step 3: Save all habitable planets to the database
                    // Only do this if we found at least one planet
                    if (planetsToSave.length > 0) {
                        // insertMany() saves multiple documents at once (faster than saving one by one)
                        await Planet.insertMany(planetsToSave);
                    }
                    
                    // Step 4: Count how many planets we saved and log it
                    const countPlanetsFound = (await Planet.find({})).length;
                    console.log(`✅ Loaded ${countPlanetsFound} habitable planets into database.`);
                    
                    // Resolve the Promise to indicate success
                    resolve();
                } catch (error) {
                    // If something goes wrong saving to database, log it and reject
                    console.error('❌ Error saving planets to database:', error);
                    reject(error);
                }
            });
    });
}

// Function to get all planets from the database
// This is used by the /planets API endpoint to return all habitable planets
// Returns: An array of planet objects
async function getAllPlanets() {
    // Use Mongoose's find() method to query the database
    // First parameter {} means "find all documents" (no filter)
    // Second parameter is the projection - which fields to include/exclude
    return await Planet.find({}, {
        '_id': 0,    // Exclude MongoDB's internal _id field (we don't need it)
        '__v': 0,    // Exclude Mongoose's version field (we don't need it)
    });
    // This returns an array like:
    // [{ keplerName: "Kepler-442 b" }, { keplerName: "Kepler-62 f" }, ...]
}

module.exports = {
    loadPlanetsData,
    getAllPlanets,
}

