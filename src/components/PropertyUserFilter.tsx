import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertyUserFilterProps {
  onUserFilter: (userId: string | null, userName: string | null) => void;
}

interface UserActivity {
  user_id: string;
  user_name: string;
  approved_count: number;
  rejected_count: number;
  total_count: number;
}

export const PropertyUserFilter = ({ onUserFilter }: PropertyUserFilterProps) => {
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserActivity();
  }, []);

  const fetchUserActivity = async () => {
    try {
      setIsLoading(true);

      // Get all properties with approval data
      const { data, error } = await supabase
        .from("properties")
        .select("approved_by, approved_by_name, approval_status")
        .not("approved_by", "is", null);

      if (error) throw error;

      // Aggregate by user
      const userMap = new Map<string, UserActivity>();

      data?.forEach((prop) => {
        const userId = prop.approved_by;
        const userName = prop.approved_by_name || "Unknown User";

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            user_name: userName,
            approved_count: 0,
            rejected_count: 0,
            total_count: 0,
          });
        }

        const user = userMap.get(userId)!;
        user.total_count++;

        if (prop.approval_status === "approved") {
          user.approved_count++;
        } else if (prop.approval_status === "rejected") {
          user.rejected_count++;
        }
      });

      const userList = Array.from(userMap.values()).sort(
        (a, b) => b.total_count - a.total_count
      );

      setUsers(userList);
    } catch (error) {
      console.error("Error fetching user activity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    if (userId === "all") {
      setSelectedUser(null);
      onUserFilter(null, null);
    } else {
      const user = users.find((u) => u.user_id === userId);
      if (user) {
        setSelectedUser(user);
        onUserFilter(user.user_id, user.user_name);
      }
    }
  };

  const clearFilter = () => {
    setSelectedUser(null);
    onUserFilter(null, null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <User className="h-4 w-4 animate-pulse" />
        Carregando usuários...
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-gray-500" />

      <Select value={selectedUser?.user_id || "all"} onValueChange={handleSelectUser}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Filtrar por usuário..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="font-medium">Todos os usuários</span>
          </SelectItem>
          {users.map((user) => (
            <SelectItem key={user.user_id} value={user.user_id}>
              <div className="flex items-center gap-2 w-full">
                <span className="font-medium">{user.user_name}</span>
                <div className="flex gap-1 ml-auto">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    ✓ {user.approved_count}
                  </Badge>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                    ✗ {user.rejected_count}
                  </Badge>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedUser && (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <User className="h-3 w-3 mr-1" />
            {selectedUser.user_name}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              className="h-4 w-4 p-0 ml-2 hover:bg-blue-200"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
          <div className="flex gap-1">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
              Aprovados: {selectedUser.approved_count}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">
              Rejeitados: {selectedUser.rejected_count}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};
