import { Button } from "@/components/ui/button";
import { Hand, Video, Brain, Zap, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Hero = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex flex-col">
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
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <Button variant="outline" onClick={() => signOut()} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => navigate("/auth")} className="gap-2">
              Sign In
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12 md:py-20 flex flex-col items-center justify-center text-center">
        <div className="max-w-4xl animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-8 border border-primary/20">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Recognition</span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Bridge the Gap with
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Sign Language</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Real-time American Sign Language recognition powered by AI. Learn, practice, and communicate seamlessly through your webcam.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up">
            <Button
              size="lg"
              className="bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow-primary text-lg px-8 py-6"
              onClick={() => user ? navigate("/recognize") : navigate("/auth")}
            >
              <Video className="w-5 h-5 mr-2" />
              {user ? "Start Recognition" : "Get Started"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 text-lg px-8 py-6"
              onClick={() => navigate("/recognize")}
            >
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <FeatureCard
              icon={<Hand className="w-8 h-8 text-primary" />}
              title="ASL Recognition"
              description="Real-time letter and word recognition with high accuracy"
            />
            <FeatureCard
              icon={<Brain className="w-8 h-8 text-accent" />}
              title="AI-Powered"
              description="Advanced machine learning models for instant translation"
            />
            <FeatureCard
              icon={<Video className="w-8 h-8 text-primary" />}
              title="Webcam Based"
              description="No special hardware needed - just your camera"
            />
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
        <p>Built with React, TypeScript, and TensorFlow.js • Privacy-first, all processing happens in your browser</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all hover:shadow-lg">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default Hero;
