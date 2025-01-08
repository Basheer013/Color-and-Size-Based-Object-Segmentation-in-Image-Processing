const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const startCameraButton = document.getElementById('start-camera');
const stopCameraButton = document.getElementById('stop-camera');
const captureImageButton = document.getElementById('capture-image');
const savedPictures = document.getElementById('saved-pictures');
let videoStream;
let animationFrameId;
let model;

// Load the COCO-SSD model
cocoSsd.load().then((loadedModel) => {
  model = loadedModel;
  console.log("COCO-SSD model loaded successfully!");
});

// Start the camera and detect objects in real-time
startCameraButton.addEventListener('click', async () => {
  const video = document.createElement('video');
  videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = videoStream;
  video.play();

  video.addEventListener('loadeddata', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detectObjects = async () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (model) {
        const predictions = await model.detect(canvas);
        drawBoundingBoxesWithDetails(predictions);
      }

      animationFrameId = requestAnimationFrame(detectObjects);
    };

    detectObjects();
  });
});

// Stop the camera
stopCameraButton.addEventListener('click', () => {
  if (videoStream) {
    const tracks = videoStream.getTracks();
    tracks.forEach((track) => track.stop());
    videoStream = null;
  }
  cancelAnimationFrame(animationFrameId);
  context.clearRect(0, 0, canvas.width, canvas.height);
});

// Capture the current image
captureImageButton.addEventListener('click', () => {
  const imageContainer = document.createElement('div');
  imageContainer.classList.add('image-container');

  // Add the captured image
  const imgURL = canvas.toDataURL();
  const img = document.createElement('img');
  img.src = imgURL;
  img.alt = 'Captured Image';
  img.classList.add('captured-image');

  // Add a delete button
  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.classList.add('delete-button');
  deleteButton.addEventListener('click', () => {
    imageContainer.remove();
  });

  // Append image and delete button to the container
  imageContainer.appendChild(img);
  imageContainer.appendChild(deleteButton);
  savedPictures.appendChild(imageContainer);
});

// Draw bounding boxes, detect colors, calculate sizes, and display labels
function drawBoundingBoxesWithDetails(predictions) {
  predictions.forEach((prediction) => {
    const [x, y, width, height] = prediction.bbox;

    // Draw the bounding box
    context.strokeStyle = '#00FF00';
    context.lineWidth = 2;
    context.strokeRect(x, y, width, height);

    // Get the object's label
    const label = `${prediction.class} (${(prediction.score * 100).toFixed(1)}%)`;

    // Detect the dominant color inside the bounding box
    const color = detectColor(x, y, width, height);

    // Display the size (width and height) of the object
    const size = `Width: ${Math.round(width)} px, Height: ${Math.round(height)} px`;

    // Draw the label, color, and size on the canvas
    context.font = '16px Arial';
    context.fillStyle = '#00FF00';
    context.fillText(label, x, y > 10 ? y - 10 : 10);
    context.fillText(`Color: ${color}`, x, y + 20);
    context.fillText(`Size: ${size}`, x, y + 40);
  });
}

// Detect the dominant color inside the bounding box
function detectColor(x, y, width, height) {
  const imageData = context.getImageData(x, y, width, height);
  const data = imageData.data;

  let r = 0, g = 0, b = 0, totalPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i];     // Red channel
    g += data[i + 1]; // Green channel
    b += data[i + 2]; // Blue channel
    totalPixels++;
  }

  r = Math.round(r / totalPixels);
  g = Math.round(g / totalPixels);
  b = Math.round(b / totalPixels);

  // Convert RGB to HSV
  const [h, s, v] = rgbToHsv(r, g, b);

  // Determine the color based on HSV ranges
  return hsvToColorName(h, s, v);
}

// Convert RGB to HSV
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0, s = 0, v = max;

  if (delta > 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  s = max === 0 ? 0 : delta / max;
  s = Math.round(s * 100);
  v = Math.round(v * 100);

  return [h, s, v];
}

// Map HSV to color names
function hsvToColorName(h, s, v) {
  if (v < 15) return 'Black';
  if (v > 85 && s < 15) return 'White';
  if (s < 15) return 'Gray';
  if (h >= 0 && h < 15) return 'Red';
  if (h >= 15 && h < 45) return 'Orange';
  if (h >= 45 && h < 75) return 'Yellow';
  if (h >= 75 && h < 150) return 'Green';
  if (h >= 150 && h < 210) return 'Cyan';
  if (h >= 210 && h < 270) return 'Blue';
  if (h >= 270 && h < 330) return 'Purple';
  if (h >= 330 && h <= 360) return 'Red';

  return 'Unidentified Color';
}
