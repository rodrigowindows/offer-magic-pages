import React from 'react';
import { SkipTraceDataViewer } from '@/components/SkipTraceDataViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSkipTraceData } from '@/hooks/useSkipTraceData';
import {
  Phone,
  Mail,
  Users,
  TrendingUp,
  Database,
  AlertCircle
} from 'lucide-react';

export const SkipTrace = () => {
  // Get summary data for statistics cards
  const { summary, loading: summaryLoading } = useSkipTraceData({
    limit: 1,
    hasSkipTraceData: true,
    autoLoad: true
  });

  const contactRate = summary ?
    Math.round(((summary.properties_with_phones + summary.properties_with_emails) / summary.total_properties) * 100) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Skip Trace Data</h1>
        <p className="text-muted-foreground">
          Visualize and manage all skip tracing contact information for properties.
          Access phone numbers, email addresses, and contact preferences extracted from public records.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? '...' : summary?.total_properties?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Properties in database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Phones</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? '...' : summary?.properties_with_phones?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Properties with phone data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? '...' : summary?.properties_with_emails?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Properties with email data
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
              {summaryLoading ? '...' : `${contactRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Properties with any contact data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertCircle className="h-5 w-5" />
            About Skip Trace Data
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
          <p>
            This data is extracted from public records and skip tracing services.
            Contact information includes primary owner details, additional phone numbers,
            and email addresses found through property records and public databases.
          </p>
          <p className="mt-2">
            <strong>Note:</strong> Always comply with local laws and regulations when using
            contact information for marketing purposes. Respect DNC (Do Not Call) lists and
            privacy preferences.
          </p>
        </CardContent>
      </Card>

      {/* Skip Trace Data Viewer */}
      <Card>
        <CardHeader>
          <CardTitle>Property Contact Details</CardTitle>
          <CardDescription>
            Browse and search through all properties with skip trace contact information.
            Use the search box to filter by address, city, or owner name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SkipTraceDataViewer initialLimit={50} />
        </CardContent>
      </Card>
    </div>
  );
};