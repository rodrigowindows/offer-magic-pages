/**
 * Hook for managing follow-up automation rules with database persistence
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FollowUpRule {
  id: string;
  name: string;
  trigger_type: string;
  delay_hours: number;
  action: string;
  channel: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export type NewFollowUpRule = Omit<FollowUpRule, "id" | "created_at" | "updated_at">;

export const useFollowUpRules = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all rules
  const {
    data: rules = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["follow_up_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_up_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FollowUpRule[];
    },
  });

  // Add a new rule
  const addRuleMutation = useMutation({
    mutationFn: async (newRule: NewFollowUpRule) => {
      const { data, error } = await supabase
        .from("follow_up_rules")
        .insert(newRule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow_up_rules"] });
      toast({ title: "Regra de automação adicionada" });
    },
    onError: (error) => {
      toast({ title: "Erro ao adicionar regra", description: error.message, variant: "destructive" });
    },
  });

  // Toggle rule enabled status
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("follow_up_rules")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow_up_rules"] });
      toast({ title: "Regra atualizada" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar regra", description: error.message, variant: "destructive" });
    },
  });

  // Delete a rule
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("follow_up_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow_up_rules"] });
      toast({ title: "Regra removida" });
    },
    onError: (error) => {
      toast({ title: "Erro ao remover regra", description: error.message, variant: "destructive" });
    },
  });

  return {
    rules,
    isLoading,
    error,
    addRule: addRuleMutation.mutate,
    toggleRule: (id: string, enabled: boolean) => toggleRuleMutation.mutate({ id, enabled }),
    deleteRule: deleteRuleMutation.mutate,
    isAdding: addRuleMutation.isPending,
    isToggling: toggleRuleMutation.isPending,
    isDeleting: deleteRuleMutation.isPending,
  };
};
