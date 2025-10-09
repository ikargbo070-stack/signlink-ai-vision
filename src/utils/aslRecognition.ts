import * as tf from "@tensorflow/tfjs";

// ASL Letter labels (A-Z)
const ASL_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z"
];

// Simple gesture recognition using hand landmark geometry
// This is a placeholder that uses geometric rules until a trained model is loaded
export const recognizeASLLetter = (landmarks: number[][]): { letter: string; confidence: number } => {
  if (!landmarks || landmarks.length === 0) {
    return { letter: "", confidence: 0 };
  }

  // Extract key points
  const wrist = landmarks[0];
  const thumb_tip = landmarks[4];
  const index_tip = landmarks[8];
  const middle_tip = landmarks[12];
  const ring_tip = landmarks[16];
  const pinky_tip = landmarks[20];
  
  const index_mcp = landmarks[5];
  const middle_mcp = landmarks[9];
  const ring_mcp = landmarks[13];
  const pinky_mcp = landmarks[17];

  // Calculate distances
  const thumbToIndex = distance(thumb_tip, index_tip);
  const thumbToMiddle = distance(thumb_tip, middle_tip);
  const thumbToRing = distance(thumb_tip, ring_tip);
  const thumbToPinky = distance(thumb_tip, pinky_tip);
  
  // Check if fingers are extended (tip above MCP joint)
  const indexExtended = index_tip[1] < index_mcp[1];
  const middleExtended = middle_tip[1] < middle_mcp[1];
  const ringExtended = ring_tip[1] < ring_mcp[1];
  const pinkyExtended = pinky_tip[1] < pinky_mcp[1];

  // Simple gesture recognition rules (demonstrative - real ASL is more complex)
  
  // Fist (A, E, M, N, S, T)
  if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    if (thumb_tip[1] < wrist[1]) {
      return { letter: "A", confidence: 75 };
    }
    return { letter: "S", confidence: 70 };
  }

  // Peace sign / V
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    const fingerAngle = Math.abs(index_tip[0] - middle_tip[0]);
    if (fingerAngle > 0.05) {
      return { letter: "V", confidence: 85 };
    }
  }

  // Pointing / D
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return { letter: "D", confidence: 80 };
  }

  // L shape
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && 
      thumb_tip[0] < index_tip[0]) {
    return { letter: "L", confidence: 82 };
  }

  // Open hand (B)
  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    // Check if fingers are close together (B vs 5)
    const fingerSpread = distance(index_tip, pinky_tip);
    if (fingerSpread < 0.15) {
      return { letter: "B", confidence: 78 };
    }
  }

  // Three fingers (W)
  if (indexExtended && middleExtended && ringExtended && !pinkyExtended) {
    return { letter: "W", confidence: 76 };
  }

  // Horn sign (I Love You)
  if (indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
    return { letter: "Y", confidence: 74 };
  }

  // OK sign (F)
  if (thumbToIndex < 0.08 && middleExtended && ringExtended && pinkyExtended) {
    return { letter: "F", confidence: 77 };
  }

  // Default fallback
  return { letter: "?", confidence: 50 };
};

// Helper function to calculate Euclidean distance
const distance = (point1: number[], point2: number[]): number => {
  const dx = point1[0] - point2[0];
  const dy = point1[1] - point2[1];
  const dz = point1[2] - point2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Normalize landmarks relative to wrist
export const normalizeLandmarks = (landmarks: number[][]): number[][] => {
  if (landmarks.length === 0) return [];
  
  const wrist = landmarks[0];
  return landmarks.map((point) => [
    point[0] - wrist[0],
    point[1] - wrist[1],
    point[2] - wrist[2],
  ]);
};

// Prepare landmarks for ML model input (when model is loaded)
export const prepareLandmarksForModel = (landmarks: number[][]): tf.Tensor => {
  const normalized = normalizeLandmarks(landmarks);
  const flattened = normalized.flat();
  return tf.tensor2d([flattened]);
};
