import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Hand, ArrowLeft, TrendingUp, Clock, Award, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProgress } from "@/hooks/useProgress";
import { supabase } from "@/integrations/supabase/client";

interface ProgressItem {
  sign_value: string;
  attempts: number;
  successful_attempts: number;
  mastered: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { stats } = useProgress();
  const [recentProgress, setRecentProgress] = useState<ProgressItem[]>([]);

  useEffect(() => {
    if (user) {
      fetchRecentProgress();
    }
  }, [user]);

  const fetchRecentProgress = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("asl_progress")
      .select("*")
      .eq("user_id", user.id)
      .order("last_practiced", { ascending: false })
      .limit(10);

    if (data) {
      setRecentProgress(data);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

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
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Button>
            <Button variant="outline" onClick={() => signOut()} className="gap-2">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Your Progress</h2>
            <p className="text-muted-foreground">Track your ASL learning journey</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Target className="w-6 h-6 text-primary" />}
              title="Total Sessions"
              value={stats.totalSessions.toString()}
              subtitle="practice sessions"
            />
            <StatCard
              icon={<Clock className="w-6 h-6 text-accent" />}
              title="Practice Time"
              value={formatTime(stats.totalPracticeTime)}
              subtitle="total time"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 text-primary" />}
              title="Avg Accuracy"
              value={`${stats.averageAccuracy}%`}
              subtitle="recognition rate"
            />
            <StatCard
              icon={<Award className="w-6 h-6 text-accent" />}
              title="Mastered"
              value={stats.masteredSigns.toString()}
              subtitle="signs learned"
            />
          </div>

          {/* Recent Progress */}
          <Card className="p-6 bg-gradient-card border-2">
            <h3 className="font-semibold text-xl mb-4">Recent Practice</h3>
            {recentProgress.length > 0 ? (
              <div className="space-y-3">
                {recentProgress.map((item, index) => {
                  const successRate = item.attempts > 0
                    ? Math.round((item.successful_attempts / item.attempts) * 100)
                    : 0;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-primary">
                          {item.sign_value}
                        </div>
                        <div>
                          <div className="font-medium">
                            Letter {item.sign_value}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.attempts} attempts • {item.successful_attempts} successful
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Success Rate</div>
                          <div className="text-lg font-semibold">{successRate}%</div>
                        </div>
                        {item.mastered && (
                          <Award className="w-6 h-6 text-accent" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Hand className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No practice data yet</p>
                <Button onClick={() => navigate("/recognize")}>Start Practicing</Button>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
}) => {
  return (
    <Card className="p-6 bg-gradient-card border-2">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-background rounded-lg">{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold mb-1">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
};

export default Dashboard;
