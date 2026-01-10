import { SkipTraceDataViewer } from '@/components/SkipTraceDataViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSkipTraceData } from '@/hooks/useSkipTraceData';
import { Phone, Mail, Users, TrendingUp } from 'lucide-react';

export default function SkipTracePage() {
  const { summary, loading } = useSkipTraceData({
    limit: 1,
    hasSkipTraceData: true,
    autoLoad: true
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Skip Trace Data</h1>
        <p className="text-muted-foreground">
          View and manage all skip tracing contact information for your properties
        </p>
      </div>

      {/* Statistics Cards */}
      {!loading && summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_properties}</div>
              <p className="text-xs text-muted-foreground">
                With skip trace data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Phones</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.properties_with_phones}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total_properties > 0
                  ? Math.round((summary.properties_with_phones / summary.total_properties) * 100)
                  : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.properties_with_emails}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total_properties > 0
                  ? Math.round((summary.properties_with_emails / summary.total_properties) * 100)
                  : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contact Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_properties > 0
                  ? Math.round(
                      ((summary.properties_with_phones + summary.properties_with_emails) /
                        (summary.total_properties * 2)) *
                        100
                    )
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average contact availability
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Data Viewer */}
      <Card>
        <CardHeader>
          <CardTitle>Property Skip Trace Data</CardTitle>
          <CardDescription>
            Browse all properties with contact information from skip tracing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SkipTraceDataViewer initialLimit={20} />
        </CardContent>
      </Card>
    </div>
  );
}
