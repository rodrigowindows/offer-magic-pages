import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  properties: Array<{ lead_status?: string; batch_name?: string | null; city?: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  following_up: "Following Up",
  offer_made: "Offer Made",
  meeting_scheduled: "Meeting",
  closed: "Closed",
  not_interested: "Not Interested",
};

const STATUS_ORDER = ["new", "contacted", "following_up", "offer_made", "meeting_scheduled", "closed", "not_interested"];

export const LeadStatusHeatmap = ({ properties }: Props) => {
  const { matrix, groups, statuses } = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {};

    properties.forEach((p) => {
      const group = p.batch_name || p.city || "Other";
      const status = p.lead_status || "new";
      if (!grouped[group]) grouped[group] = {};
      grouped[group][status] = (grouped[group][status] || 0) + 1;
    });

    const groups = Object.keys(grouped).slice(0, 10); // top 10
    const statuses = STATUS_ORDER.filter((s) =>
      groups.some((g) => (grouped[g]?.[s] || 0) > 0)
    );

    return { matrix: grouped, groups, statuses };
  }, [properties]);

  const maxVal = useMemo(() => {
    let max = 1;
    groups.forEach((g) => statuses.forEach((s) => {
      const v = matrix[g]?.[s] || 0;
      if (v > max) max = v;
    }));
    return max;
  }, [matrix, groups, statuses]);

  const getOpacity = (val: number) => Math.max(0.1, val / maxVal);

  if (groups.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader><CardTitle className="text-lg">Lead Distribution Heatmap</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No data available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Lead Distribution Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 px-1 font-medium text-muted-foreground">Batch / City</th>
                {statuses.map((s) => (
                  <th key={s} className="text-center py-2 px-1 font-medium text-muted-foreground">
                    {STATUS_LABELS[s] || s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TooltipProvider>
                {groups.map((g) => (
                  <tr key={g}>
                    <td className="py-1 px-1 font-medium text-foreground truncate max-w-[120px]">{g}</td>
                    {statuses.map((s) => {
                      const val = matrix[g]?.[s] || 0;
                      return (
                        <td key={s} className="py-1 px-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="w-full h-8 rounded-md flex items-center justify-center font-bold text-xs transition-all cursor-default"
                                style={{
                                  backgroundColor: `hsl(var(--primary) / ${getOpacity(val)})`,
                                  color: getOpacity(val) > 0.5 ? "white" : "hsl(var(--foreground))",
                                }}
                              >
                                {val > 0 ? val : ""}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{g} · {STATUS_LABELS[s]}: {val} leads</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </TooltipProvider>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
