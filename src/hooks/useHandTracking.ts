import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";

export const useHandTracking = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onResults: (landmarks: number[][]) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Initialize HandLandmarker
  useEffect(() => {
    const initializeHandLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          numHands: 1,
          runningMode: "VIDEO",
          minHandDetectionConfidence: 0.7,
          minHandPresenceConfidence: 0.7,
          minTrackingConfidence: 0.7
        });

        handLandmarkerRef.current = handLandmarker;
      } catch (error) {
        console.error("Error initializing hand landmarker:", error);
      }
    };

    initializeHandLandmarker();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
      const landmarks = results.landmarks[0];

      // Draw connections
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [5, 9], [9, 13], [13, 17] // Palm
      ];

      // Draw hand connections
      canvasCtx.strokeStyle = "#A855F7";
      canvasCtx.lineWidth = 2;
      connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        canvasCtx.beginPath();
        canvasCtx.moveTo(startPoint.x * canvasRef.current!.width, startPoint.y * canvasRef.current!.height);
        canvasCtx.lineTo(endPoint.x * canvasRef.current!.width, endPoint.y * canvasRef.current!.height);
        canvasCtx.stroke();
      });

      // Draw hand landmarks
      canvasCtx.fillStyle = "#06B6D4";
      landmarks.forEach((landmark) => {
        canvasCtx.beginPath();
        canvasCtx.arc(
          landmark.x * canvasRef.current!.width,
          landmark.y * canvasRef.current!.height,
          3,
          0,
          2 * Math.PI
        );
        canvasCtx.fill();
      });

      // Convert landmarks to array format for ML processing
      const landmarkArray = landmarks.map((landmark) => [
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
      return;
    }

    const video = videoRef.current;
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
    if (isProcessing) {
      animationFrameRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [videoRef, canvasRef, drawResults, isProcessing]);

  const startTracking = useCallback(async () => {
    if (!videoRef.current || !handLandmarkerRef.current) {
      console.warn("Video or HandLandmarker not ready");
      return;
    }

    setIsProcessing(true);
  }, [videoRef]);

  const stopTracking = useCallback(() => {
    setIsProcessing(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastVideoTimeRef.current = -1;
  }, []);

  // Start/stop prediction loop based on isProcessing
  useEffect(() => {
    if (isProcessing && handLandmarkerRef.current) {
      predictWebcam();
    }
  }, [isProcessing, predictWebcam]);

  return { startTracking, stopTracking, isProcessing };
};
