import { useEffect, useRef, useState } from "react";
import { Hands, Results } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";

export const useHandTracking = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onResults: (landmarks: number[][]) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: Results) => {
      if (!canvasRef.current) return;

      const canvasCtx = canvasRef.current.getContext("2d");
      if (!canvasCtx) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Draw hand connections
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
          color: "#A855F7",
          lineWidth: 2,
        });

        // Draw hand landmarks
        drawLandmarks(canvasCtx, landmarks, {
          color: "#06B6D4",
          fillColor: "#06B6D4",
          radius: 3,
        });

        // Convert landmarks to array format for ML processing
        const landmarkArray = landmarks.map((landmark) => [
          landmark.x,
          landmark.y,
          landmark.z,
        ]);

        onResults(landmarkArray);
      }

      canvasCtx.restore();
    });

    handsRef.current = hands;

    return () => {
      hands.close();
    };
  }, [videoRef, canvasRef, onResults]);

  const startTracking = async () => {
    if (!videoRef.current || !handsRef.current) return;

    try {
      setIsProcessing(true);

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720,
      });

      cameraRef.current = camera;
      await camera.start();
    } catch (error) {
      console.error("Error starting hand tracking:", error);
      setIsProcessing(false);
    }
  };

  const stopTracking = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    setIsProcessing(false);
  };

  return { startTracking, stopTracking, isProcessing };
};
