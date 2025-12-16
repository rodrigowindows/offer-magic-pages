import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Get user display name (email or metadata)
  const getUserName = () => {
    if (!user) return null;
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "Unknown User";
  };

  return {
    user,
    userId: user?.id,
    userName: getUserName(),
    userEmail: user?.email,
    loading,
  };
};
