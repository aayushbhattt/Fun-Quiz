// Simple script to list images in the images folder
// This will be used by admin panel to show available images

// List of images - admin needs to manually update this list when adding new images
// Or we can auto-detect using a simple file listing approach

const availableImages = [
  // Add your image filenames here
  // Example:
  // 'question1.jpg',
  // 'question2.png',
  // 'animal.jpg',
];

// Function to get image path
function getImagePath(filename) {
  return `images/${filename}`;
}

// Export for use in admin panel
export { availableImages, getImagePath };
