import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 px-4">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} size="lg">
            {action.label}
          </Button>
        )}
        {children}
      </CardContent>
    </Card>
  );
};
