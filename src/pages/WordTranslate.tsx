import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Hand, Camera, CameraOff, ArrowLeft, Zap, BarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useHandTracking } from "@/hooks/useHandTracking";
import { recognizeASLWord, ASL_WORDS } from "@/utils/aslWordRecognition";
import { useProgress } from "@/hooks/useProgress";

const WordTranslate = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [prediction, setPrediction] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [detectedHand, setDetectedHand] = useState(false);
  const [sessionStart, setSessionStart] = useState<number>(0);
  const [recognitionCount, setRecognitionCount] = useState(0);
  const { updateProgress, saveSession } = useProgress();

  const handleHandDetection = useCallback((landmarks: number[][]) => {
    setDetectedHand(true);
    const result = recognizeASLWord(landmarks);
    
    if (result.word && result.word !== "?") {
      setPrediction(result.word);
      setConfidence(result.confidence);
      
      if (result.confidence >= 70) {
        setRecognitionCount(prev => prev + 1);
        updateProgress("word", result.word, true);
      }
    }
  }, [updateProgress]);

  const { startTracking, stopTracking, isProcessing } = useHandTracking(
    videoRef,
    canvasRef,
    handleHandDetection
  );

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      });

      if (videoRef.current && canvasRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current && canvasRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
        };

        setIsStreaming(true);
        setSessionStart(Date.now());
        toast.success("Camera started - initializing AI...");
        
        setTimeout(() => {
          startTracking();
          toast.success("AI hand tracking active!");
        }, 1000);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera. Please check permissions.");
    }
  };

  const stopCamera = async () => {
    stopTracking();
    
    if (sessionStart > 0) {
      const duration = Math.floor((Date.now() - sessionStart) / 1000);
      const avgAccuracy = recognitionCount > 0 ? confidence : 0;
      await saveSession("word", duration, avgAccuracy);
      toast.success(`Session saved: ${duration}s practice time`);
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      setPrediction("");
      setConfidence(0);
      setDetectedHand(false);
      setSessionStart(0);
      setRecognitionCount(0);
      toast.info("Camera stopped");
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center shadow-glow-primary">
              <Hand className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              SignLink
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
              <BarChart className="w-4 h-4" />
              Dashboard
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-center">ASL Word Translation</h2>
          <p className="text-muted-foreground text-center mb-8">
            Practice common ASL words with real-time recognition
          </p>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Feed */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-card border-2">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  />
                  {!isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <div className="text-center">
                        <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Camera not active</p>
                      </div>
                    </div>
                  )}
                  {isStreaming && isProcessing && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg">
                      <Zap className="w-4 h-4 animate-pulse" />
                      <span className="text-sm font-medium">AI Tracking Active</span>
                    </div>
                  )}
                  {isStreaming && detectedHand && (
                    <div className="absolute top-4 right-4 bg-accent/90 text-accent-foreground px-3 py-2 rounded-lg">
                      <span className="text-sm font-medium">✓ Hand Detected</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-3 justify-center">
                  {!isStreaming ? (
                    <Button
                      onClick={startCamera}
                      className="bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow-primary gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Start Camera
                    </Button>
                  ) : (
                    <Button
                      onClick={stopCamera}
                      variant="destructive"
                      className="gap-2"
                    >
                      <CameraOff className="w-4 h-4" />
                      Stop Camera
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="space-y-4">
              <Card className="p-6 bg-gradient-card border-2">
                <h3 className="font-semibold text-lg mb-4">Recognition Result</h3>
                {prediction ? (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-4 animate-pulse-glow capitalize">
                      {prediction}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Confidence
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-hero h-2 rounded-full transition-all duration-300"
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                    <p className="text-sm font-medium">{confidence}%</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Hand className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Start camera to begin recognition</p>
                  </div>
                )}
              </Card>

              <Card className="p-6 bg-gradient-card border-2">
                <h3 className="font-semibold text-lg mb-3">Practice Words</h3>
                <div className="space-y-2">
                  {ASL_WORDS.map((word) => (
                    <div
                      key={word}
                      className={`px-3 py-2 rounded-lg border capitalize ${
                        prediction === word
                          ? "bg-primary/10 border-primary text-primary font-semibold"
                          : "border-border"
                      }`}
                    >
                      {word}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-gradient-card border-2">
                <h3 className="font-semibold text-lg mb-3">Instructions</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Ensure good lighting for best results</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent">•</span>
                    <span>Hold each sign steady for recognition</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Practice the 5 common ASL words</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent">•</span>
                    <span>Your progress is automatically saved</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WordTranslate;
