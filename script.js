// DOM Elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const timerDisplay = document.getElementById('timer');
const statusDisplay = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const loadingElement = document.getElementById('loading');
const focusedTimeDisplay = document.getElementById('focusedTime');
const distractedTimeDisplay = document.getElementById('distractedTime');
const sensitivitySelect = document.getElementById('sensitivity');
const angleThresholdInput = document.getElementById('angleThreshold');

// Timer variables
let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;
let isFocused = false;
let focusedTime = 0;
let distractedTime = 0;
let lastDetectionTime = 0;

// Face detection variables
let faceDetectionInterval;
let detectionSensitivity = 0.5;
let angleThreshold = 30;
let modelsLoaded = false;

// Load face detection models
async function loadModels() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        modelsLoaded = true;
        loadingElement.style.display = 'none';
        console.log('Models loaded successfully');
    } catch (error) {
        console.error('Error loading models:', error);
        loadingElement.innerHTML = '<p>Error loading face detection models. Please refresh the page.</p>';
    }
}

// Start video stream
async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        console.log('Camera access granted');
    } catch (err) {
        console.error('Error accessing camera:', err);
        loadingElement.innerHTML = '<p>Could not access camera. Please enable camera permissions.</p>';
    }
}

// Detect faces and determine focus state
async function detectFaces() {
    if (!modelsLoaded || !isRunning) return;
    
    try {
        const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: detectionSensitivity
        });
        
        const detections = await faceapi.detectAllFaces(video, options)
            .withFaceLandmarks();
        
        const now = Date.now();
        const canvasContext = canvas.getContext('2d');
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw detections
        faceapi.draw.drawDetections(canvas, detections);
        faceapi.draw.drawFaceLandmarks(canvas, detections);
        
        if (detections.length > 0) {
            lastDetectionTime = now;
            
            // Check head angle
            const landmarks = detections[0].landmarks;
            const nose = landmarks.getNose();
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();
            
            // Calculate approximate head angle
            const eyeMidX = (leftEye[0].x + rightEye[3].x) / 2;
            const noseX = nose[3].x;
            const xDiff = Math.abs(eyeMidX - noseX);
            const angle = Math.atan(xDiff / (nose[6].y - nose[0].y)) * (180 / Math.PI);
            
            updateFocusState(angle < angleThreshold);
        } else {
            // No faces detected
            if (now - lastDetectionTime > 1000) { // 1 second grace period
                updateFocusState(false);
            }
        }
    } catch (error) {
        console.error('Face detection error:', error);
    }
}

// Update focus state and UI
function updateFocusState(focused) {
    if (isFocused !== focused) {
        isFocused = focused;
        
        if (focused) {
            statusDisplay.textContent = 'FOCUSED';
            statusDisplay.className = 'status-indicator focused';
        } else {
            statusDisplay.textContent = 'DISTRACTED';
            statusDisplay.className = 'status-indicator distracted';
        }
    }
}

// Format time for display
function formatTime(ms) {
    const date = new Date(ms);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    
    if (hours === '00') {
        return `${minutes}:${seconds}`;
    }
    return `${hours}:${minutes}:${seconds}`;
}

// Update timer display
function updateTimer() {
    const currentTime = isRunning ? Date.now() - startTime + elapsedTime : elapsedTime;
    timerDisplay.textContent = formatTime(currentTime);
    
    // Update focused/distracted time
    if (isRunning) {
        if (isFocused) {
            focusedTime += 100;
        } else {
            distractedTime += 100;
        }
        
        focusedTimeDisplay.textContent = formatTime(focusedTime);
        distractedTimeDisplay.textContent = formatTime(distractedTime);
    }
}

// Start timer
function startTimer() {
    if (!isRunning) {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 100);
        faceDetectionInterval = setInterval(detectFaces, 500);
        isRunning = true;
        
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
    }
}

// Pause timer
function pauseTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        clearInterval(faceDetectionInterval);
        elapsedTime += Date.now() - startTime;
        isRunning = false;
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
}

// Reset timer
function resetTimer() {
    clearInterval(timerInterval);
    clearInterval(faceDetectionInterval);
    elapsedTime = 0;
    focusedTime = 0;
    distractedTime = 0;
    isRunning = false;
    isFocused = false;
    
    timerDisplay.textContent = '00:00:00';
    focusedTimeDisplay.textContent = '00:00';
    distractedTimeDisplay.textContent = '00:00';
    statusDisplay.textContent = 'NOT FOCUSED';
    statusDisplay.className = 'status-indicator distracted';
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

sensitivitySelect.addEventListener('change', () => {
    detectionSensitivity = parseFloat(sensitivitySelect.value);
});

angleThresholdInput.addEventListener('change', () => {
    angleThreshold = parseInt(angleThresholdInput.value);
});

// Initialize
window.addEventListener('DOMContentLoaded', async () => {
    await loadModels();
    await startVideo();
    
    // Set canvas size to match video
    video.addEventListener('play', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    });
});

// Add structured data for SEO
const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "FocusTrack",
    "description": "Smart study timer that tracks your focused study time using face detection technology",
    "applicationCategory": "Productivity",
    "operatingSystem": "Web Browser",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
    }
};

const scriptTag = document.createElement('script');
scriptTag.type = 'application/ld+json';
scriptTag.text = JSON.stringify(structuredData);
document.head.appendChild(scriptTag);
