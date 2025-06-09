import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

const FaceDetection = () => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' }>({
    message: 'Loading models...',
    type: 'info'
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Starting to load models...');
        setStatus({ message: 'Loading models from local files...', type: 'info' });
        
        // Load two essential models from the public directory:
        // 1. SSD MobileNet - for detecting face locations in the image
        // 2. Face Landmark 68 - for identifying facial features/landmarks
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        
        console.log('Models loaded successfully');
        setIsModelLoaded(true);
        setStatus({ message: 'All models loaded successfully', type: 'success' });
      } catch (error) {
        console.error('Model loading error:', error);
        setStatus({ 
          message: `Error loading models: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          type: 'error' 
        });
      }
    };

    loadModels();
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isModelLoaded) {
      setStatus({ message: 'Please wait for models to load...', type: 'warning' });
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Create a new image object from the uploaded file
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      // Wait for image to load before processing
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Set up canvas to match image dimensions
      const canvas = canvasRef.current;
      const displaySize = { width: img.width, height: img.height };
      if (canvas) {
        canvas.width = displaySize.width;
        canvas.height = displaySize.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw the original image onto canvas
          ctx.drawImage(img, 0, 0);
        }
      }

      // Store image reference (hidden from view but used for processing)
      if (imageRef.current) {
        imageRef.current.src = img.src;
        imageRef.current.style.display = 'none';
      }

      // Start face detection process
      setStatus({ message: 'Detecting faces...', type: 'info' });
      // Use face-api to detect faces and their landmarks
      const detections = await faceapi.detectAllFaces(img).withFaceLandmarks();

      // Handle case where no faces are found
      if (detections.length === 0) {
        setStatus({ message: 'No faces detected in the ID card', type: 'warning' });
        return;
      }

      // Draw the detection results onto the canvas
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Redraw original image
          ctx.drawImage(img, 0, 0);
          // Draw face detection boxes
          faceapi.draw.drawDetections(canvas, detections);
          // Draw facial landmarks (68 points marking eyes, nose, mouth, etc)
          faceapi.draw.drawFaceLandmarks(canvas, detections);
        }
      }

      // Update status with detection results
      setStatus({ message: `Detected ${detections.length} face(s) in the ID card`, type: 'success' });
    } catch (error) {
      console.error('Image processing error:', error);
      setStatus({ 
        message: `Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        type: 'error' 
      });
    }
  };

  return (
    <div className="face-detection">
      <div className="upload-section">
        <input
          type="file"
          id="imageInput"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <button 
          className="upload-button"
          onClick={() => document.getElementById('imageInput')?.click()}
          disabled={!isModelLoaded}
        >
          Upload ID Card Image
        </button>
        <p>Supported formats: JPG, PNG</p>
      </div>

      <div className="preview-section">
        <canvas ref={canvasRef} style={{ maxWidth: '100%', display: 'block', margin: '20px auto' }} />
        <img ref={imageRef} alt="preview" style={{ display: 'none' }} />
      </div>

      <div className={`status ${status.type}`}>
        {status.message}
      </div>
    </div>
  );
};

export default FaceDetection; 