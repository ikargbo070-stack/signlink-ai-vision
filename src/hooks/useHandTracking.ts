import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";

export const useHandTracking = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onResults: (landmarks: number[][]) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const isProcessingRef = useRef(false);

  // Initialize HandLandmarker
  useEffect(() => {
    const initializeHandLandmarker = async () => {
      try {
        console.log("Initializing HandLandmarker...");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          numHands: 2,
          runningMode: "VIDEO",
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        handLandmarkerRef.current = handLandmarker;
        setIsModelReady(true);
        console.log("HandLandmarker initialized successfully!");
      } catch (error) {
        console.error("Error initializing hand landmarker:", error);
        // Try with CPU fallback
        try {
          console.log("Retrying with CPU delegate...");
          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );

          const handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "CPU"
            },
            numHands: 2,
            runningMode: "VIDEO",
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          handLandmarkerRef.current = handLandmarker;
          setIsModelReady(true);
          console.log("HandLandmarker initialized with CPU fallback!");
        } catch (cpuError) {
          console.error("Failed to initialize with CPU fallback:", cpuError);
        }
      }
    };

    initializeHandLandmarker();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  const drawResults = useCallback((results: HandLandmarkerResult) => {
    if (!canvasRef.current) return;

    const canvasCtx = canvasRef.current.getContext("2d");
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.landmarks && results.landmarks.length > 0) {
      // Process all detected hands
      results.landmarks.forEach((landmarks, handIndex) => {
        // Draw connections
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // Index
          [0, 9], [9, 10], [10, 11], [11, 12], // Middle
          [0, 13], [13, 14], [14, 15], [15, 16], // Ring
          [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
          [5, 9], [9, 13], [13, 17] // Palm
        ];

        // Different colors for each hand
        const colors = ["#A855F7", "#06B6D4"];
        const pointColors = ["#06B6D4", "#A855F7"];

        // Draw hand connections
        canvasCtx.strokeStyle = colors[handIndex % 2];
        canvasCtx.lineWidth = 3;
        connections.forEach(([start, end]) => {
          const startPoint = landmarks[start];
          const endPoint = landmarks[end];
          canvasCtx.beginPath();
          canvasCtx.moveTo(startPoint.x * canvasRef.current!.width, startPoint.y * canvasRef.current!.height);
          canvasCtx.lineTo(endPoint.x * canvasRef.current!.width, endPoint.y * canvasRef.current!.height);
          canvasCtx.stroke();
        });

        // Draw hand landmarks
        canvasCtx.fillStyle = pointColors[handIndex % 2];
        landmarks.forEach((landmark) => {
          canvasCtx.beginPath();
          canvasCtx.arc(
            landmark.x * canvasRef.current!.width,
            landmark.y * canvasRef.current!.height,
            5,
            0,
            2 * Math.PI
          );
          canvasCtx.fill();
        });
      });

      // Convert first hand landmarks to array format for ML processing
      const landmarkArray = results.landmarks[0].map((landmark) => [
        landmark.x,
        landmark.y,
        landmark.z || 0,
      ]);

      onResults(landmarkArray);
    }

    canvasCtx.restore();
  }, [canvasRef, onResults]);

  const predictWebcam = useCallback(() => {
    if (!videoRef.current || !handLandmarkerRef.current || !canvasRef.current) {
      if (isProcessingRef.current) {
        animationFrameRef.current = requestAnimationFrame(predictWebcam);
      }
      return;
    }

    const video = videoRef.current;
    
    // Only process if video is playing and has dimensions
    if (video.readyState < 2 || video.videoWidth === 0) {
      if (isProcessingRef.current) {
        animationFrameRef.current = requestAnimationFrame(predictWebcam);
      }
      return;
    }

    const startTimeMs = performance.now();

    // Only process if video has new frame
    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      
      try {
        const results = handLandmarkerRef.current.detectForVideo(video, startTimeMs);
        drawResults(results);
      } catch (error) {
        console.error("Error detecting hand:", error);
      }
    }

    // Continue prediction loop
    if (isProcessingRef.current) {
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [videoRef, canvasRef, drawResults]);

  const startTracking = useCallback(async () => {
    if (!videoRef.current) {
      console.warn("Video element not ready");
      return false;
    }

    if (!handLandmarkerRef.current) {
      console.warn("HandLandmarker not ready yet, please wait...");
      return false;
    }

    console.log("Starting hand tracking...");
    isProcessingRef.current = true;
    setIsProcessing(true);
    predictWebcam();
    return true;
  }, [videoRef, predictWebcam]);

  const stopTracking = useCallback(() => {
    console.log("Stopping hand tracking...");
    isProcessingRef.current = false;
    setIsProcessing(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastVideoTimeRef.current = -1;
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [canvasRef]);

  return { startTracking, stopTracking, isProcessing, isModelReady };
};
