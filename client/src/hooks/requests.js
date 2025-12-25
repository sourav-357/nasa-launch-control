// Base URL for the API server
// React requires environment variables to start with REACT_APP_
// Get the API URL from environment variable, or use localhost:8000 as default for development
// In production, set REACT_APP_API_URL in your .env file to your actual backend URL
// Example: REACT_APP_API_URL=https://api.yourdomain.com
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Function to fetch all planets from the API
// This is an async function, which means it returns a Promise
// When you call this function, you need to use await or .then() to get the result
// Returns: An array of planet objects like [{ keplerName: "Kepler-442 b" }, ...]
async function httpGetPlanets() {
  try {
    // Make a GET request to the /planets endpoint
    // fetch() is a built-in browser function for making HTTP requests
    // It returns a Promise that resolves to a Response object
    const response = await fetch(`${API_URL}/planets`);
    
    // Check if the response was successful (status code 200-299)
    // If not, throw an error so we can catch it below
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Parse the JSON response into a JavaScript object/array
    // response.json() also returns a Promise, so we use await
    const planets = await response.json();
    return planets;
  } catch (error) {
    // If something goes wrong (network error, server error, etc.)
    // Log the error so we can see what happened
    console.error('Error fetching planets:', error);
    // Return an empty array instead of crashing
    // This way the app can still work even if the API is down
    return [];
  }
}

// Function to fetch all launches from the API
// This gets both upcoming and past launches
// Returns: A sorted array of launch objects, sorted by flight number
async function httpGetLaunches() {
  try {
    // Make a GET request to the /launches endpoint
    const response = await fetch(`${API_URL}/launches`);
    
    // Check if the response was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Parse the JSON response into a JavaScript array
    const fetchedLaunches = await response.json();
    
    // Sort launches by flight number in ascending order (100, 101, 102, ...)
    // This ensures launches are displayed in chronological order
    // The sort() function compares two launches and returns:
    //   - negative number if a should come before b
    //   - positive number if a should come after b
    //   - 0 if they're equal
    const sortedLaunches = fetchedLaunches.sort((a, b) => {
      return a.flightNumber - b.flightNumber;
    });
    
    return sortedLaunches;
  } catch (error) {
    // If something goes wrong, log it and return empty array
    console.error('Error fetching launches:', error);
    return [];
  }
}

// Function to submit a new launch to the API
// This creates a new launch in the database
// Parameters:
//   - launch: An object with mission, rocket, launchDate, and target properties
// Returns: A Response object from the fetch API
async function httpSubmitLaunch(launch) {
  try {
    // Make a POST request to the /launches endpoint
    // POST is the HTTP method used for creating new resources
    const response = await fetch(`${API_URL}/launches`, {
      method: "POST", // HTTP method for creating new resources
      headers: {
        // Tell the server we're sending JSON data
        // The server needs to know this so it can parse the data correctly
        "Content-Type": "application/json",
      },
      // Convert the launch object to a JSON string
      // fetch() requires the body to be a string, not an object
      body: JSON.stringify(launch),
    });
    
    return response;
  } catch(err) {
    // If there's a network error (like server is down), catch it here
    // Return a fake response object with ok: false
    // This prevents the app from crashing and allows us to show an error message
    console.error('Network error submitting launch:', err);
    return {
      ok: false,
    };
  }
}

// Function to abort (cancel) a launch
// This marks a launch as aborted in the database (doesn't actually delete it)
// Parameters:
//   - id: The flight number of the launch to abort (e.g., 100, 101, 102)
// Returns: A Response object from the fetch API
async function httpAbortLaunch(id) {
  try {
    // Make a DELETE request to the /launches/:id endpoint
    // DELETE is the standard HTTP method for removing/canceling resources
    // The :id in the URL is replaced with the actual flight number
    // Example: DELETE http://localhost:8000/launches/100
    const response = await fetch(`${API_URL}/launches/${id}`, {
      method: "DELETE",
    });
    
    return response;
  } catch(error) {
    // If there's a network error, log it and return a failed response
    console.error('Network error aborting launch:', error);
    return {
      ok: false,
    };
  } 
}

// Export all functions so they can be imported in other files
// When you import this file, you can use these functions like:
//   import { httpGetPlanets, httpGetLaunches } from './requests';
export {
  httpGetPlanets,
  httpGetLaunches,
  httpSubmitLaunch,
  httpAbortLaunch,
};

