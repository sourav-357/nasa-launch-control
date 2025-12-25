// Configuration for Arwes UI resources (images, patterns, etc.)
// These paths point to static files in the public directory
const resources = {
  background: {
    small: "/img/background-small.jpg",    // Small background image for mobile devices
    medium: "/img/background-medium.jpg", // Medium background image for tablets
    large: "/img/background-large.jpg",   // Large background image for desktops
  },
  pattern: "/img/glow.png",  // Glow pattern overlay for sci-fi effect
};

// Configuration for sound effects
// These sounds play when users interact with the app (clicks, success, errors, etc.)
const sounds = {
  shared: {
    volume: 0.5,  // Default volume for all sounds (0.0 to 1.0)
  },
  players: {
    // Click sound - plays when user clicks buttons or links
    click: {
      sound: { src: ["/sound/click.mp3"] },
      settings: { oneAtATime: true }  // Only play one instance at a time
    },
    // Typing sound - plays during text input (if implemented)
    typing: {
      sound: { src: ["/sound/typing.mp3"] },
      settings: { oneAtATime: true }
    },
    // Deploy sound - plays when deploying something (if implemented)
    deploy: {
      sound: { src: ["/sound/deploy.mp3"] },
      settings: { oneAtATime: true }
    },
    // Success sound - plays when a launch is successfully created
    success: {
      sound: {
        src: ["/sound/success.mp3"],
        volume: 0.2,  // Lower volume for success sound
      },
      settings: { oneAtATime: true }
    },
    // Abort sound - plays when a launch is aborted
    abort: {
      sound: { src: ["/sound/abort.mp3"] },
      settings: { oneAtATime: true }
    },
    // Warning sound - plays when an error occurs
    warning: {
      sound: { src: ["/sound/warning.mp3"] },
      settings: { oneAtATime: true }
    },
  }
};

// Theme configuration for Arwes UI
// This defines the visual style of the application (colors, fonts, spacing, etc.)
const theme = {
  color: {
    content: "#a1ecfb",  // Main text color (cyan/blue for sci-fi look)
  },
  padding: 20,  // Default padding for components
  responsive: {
    small: 600,   // Breakpoint for small screens (mobile)
    medium: 800,  // Breakpoint for medium screens (tablet)
    large: 1200   // Breakpoint for large screens (desktop)
  },
  typography: {
    // Font family for headers
    headerFontFamily: '"Titillium Web", "sans-serif"',
  },
};

// Export all configuration objects so they can be imported in other files
export {
  resources,  // Image and pattern resources
  sounds,     // Sound effect configuration
  theme,      // Visual theme configuration
};

