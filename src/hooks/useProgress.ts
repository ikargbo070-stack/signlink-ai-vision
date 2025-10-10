import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProgressStats {
  totalSessions: number;
  totalPracticeTime: number;
  averageAccuracy: number;
  masteredSigns: number;
}

export const useProgress = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats>({
    totalSessions: 0,
    totalPracticeTime: 0,
    averageAccuracy: 0,
    masteredSigns: 0,
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    // Fetch learning sessions
    const { data: sessions } = await supabase
      .from("learning_sessions")
      .select("*")
      .eq("user_id", user.id);

    // Fetch progress
    const { data: progress } = await supabase
      .from("asl_progress")
      .select("*")
      .eq("user_id", user.id);

    if (sessions && progress) {
      const totalTime = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);
      const avgAccuracy = sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessions.length
        : 0;
      const mastered = progress.filter((p) => p.mastered).length;

      setStats({
        totalSessions: sessions.length,
        totalPracticeTime: totalTime,
        averageAccuracy: Math.round(avgAccuracy),
        masteredSigns: mastered,
      });
    }
  };

  const saveSession = async (sessionType: string, duration: number, accuracy: number) => {
    if (!user) return;

    await supabase.from("learning_sessions").insert({
      user_id: user.id,
      session_type: sessionType,
      duration_seconds: duration,
      accuracy,
    });

    await fetchStats();
  };

  const updateProgress = async (signType: string, signValue: string, success: boolean) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("asl_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("sign_type", signType)
      .eq("sign_value", signValue)
      .single();

    if (existing) {
      const newAttempts = existing.attempts + 1;
      const newSuccessful = success ? existing.successful_attempts + 1 : existing.successful_attempts;
      const successRate = (newSuccessful / newAttempts) * 100;

      await supabase
        .from("asl_progress")
        .update({
          attempts: newAttempts,
          successful_attempts: newSuccessful,
          mastered: successRate >= 80 && newAttempts >= 10,
          last_practiced: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("asl_progress").insert({
        user_id: user.id,
        sign_type: signType,
        sign_value: signValue,
        attempts: 1,
        successful_attempts: success ? 1 : 0,
      });
    }

    await fetchStats();
  };

  return { stats, saveSession, updateProgress, refreshStats: fetchStats };
};
