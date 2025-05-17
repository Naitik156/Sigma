// Add this to your script.js
const modelPath = window.location.pathname.includes('github.io') 
  ? '/YOUR-REPO-NAME/models/' 
  : '/models/';

async function loadModels() {
  try {
    // Show loading status
    document.getElementById('status').textContent = 'LOADING MODELS...';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelPath)
    ]);
    
    console.log('All models loaded successfully!');
    document.getElementById('status').textContent = 'READY - FACE THE CAMERA';
    
  } catch (error) {
    console.error('Model loading failed:', error);
    document.getElementById('status').textContent = 'MODEL ERROR: ' + error.message;
  }
}

// Call the function
loadModels();
