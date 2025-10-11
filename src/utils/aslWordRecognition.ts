// ASL Word Recognition - Common sign words
export const ASL_WORDS = ["hello", "i love you", "me", "my", "sit"];

interface WordRecognitionResult {
  word: string;
  confidence: number;
}

// Helper function to calculate Euclidean distance
const distance = (point1: number[], point2: number[]): number => {
  const dx = point1[0] - point2[0];
  const dy = point1[1] - point2[1];
  const dz = point1[2] - point2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Recognize ASL words based on hand landmarks
export const recognizeASLWord = (landmarks: number[][]): WordRecognitionResult => {
  if (!landmarks || landmarks.length === 0) {
    return { word: "", confidence: 0 };
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

  // Check if fingers are extended (tip above MCP joint)
  const indexExtended = index_tip[1] < index_mcp[1];
  const middleExtended = middle_tip[1] < middle_mcp[1];
  const ringExtended = ring_tip[1] < ring_mcp[1];
  const pinkyExtended = pinky_tip[1] < pinky_mcp[1];

  // Calculate distances
  const thumbToIndex = distance(thumb_tip, index_tip);
  const thumbToMiddle = distance(thumb_tip, middle_tip);
  const thumbToPinky = distance(thumb_tip, pinky_tip);

  // HELLO - Open hand waving motion (detected as open palm)
  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    const fingerSpread = distance(index_tip, pinky_tip);
    if (fingerSpread > 0.15) {
      return { word: "hello", confidence: 82 };
    }
  }

  // I LOVE YOU - Index, pinky, and thumb extended (ILY sign)
  if (indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
    const thumbExtended = thumb_tip[1] < wrist[1] - 0.1;
    if (thumbExtended) {
      return { word: "i love you", confidence: 88 };
    }
  }

  // ME - Point to self (index pointing towards body)
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    // Check if hand orientation suggests pointing at self
    const pointingInward = index_tip[2] < wrist[2] - 0.05;
    if (pointingInward) {
      return { word: "me", confidence: 80 };
    }
  }

  // MY - Flat hand on chest area (palm facing body)
  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    const fingerSpread = distance(index_tip, pinky_tip);
    const palmFlat = fingerSpread < 0.12;
    const nearChest = wrist[2] < -0.1;
    if (palmFlat && nearChest) {
      return { word: "my", confidence: 78 };
    }
  }

  // SIT - Two fingers down like legs (index and middle extended, bent down)
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    const fingerAngle = Math.abs(index_tip[0] - middle_tip[0]);
    const fingersParallel = fingerAngle < 0.08;
    const pointingDown = index_tip[1] > wrist[1];
    if (fingersParallel && pointingDown) {
      return { word: "sit", confidence: 75 };
    }
  }

  // Default fallback
  return { word: "?", confidence: 50 };
};
