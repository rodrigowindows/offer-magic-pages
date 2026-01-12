import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUsageAnalytics } from '@/contexts/UsageAnalyticsContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Users, Eye, EyeOff, RefreshCw, Download, AlertTriangle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const UsageAnalyticsDashboard: React.FC = () => {
  const {
    features,
    getMostUsedFeatures,
    getLeastUsedFeatures,
    getUnusedFeatures,
    getCategoryStats,
    resetUsageData,
  } = useUsageAnalytics();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculate overall statistics
  const stats = useMemo(() => {
    const totalFeatures = features.length;
    const usedFeatures = features.filter(f => f.usageCount > 0).length;
    const unusedFeatures = totalFeatures - usedFeatures;
    const totalUsage = features.reduce((sum, f) => sum + f.usageCount, 0);
    const avgUsage = totalUsage / totalFeatures;

    return {
      totalFeatures,
      usedFeatures,
      unusedFeatures,
      totalUsage,
      avgUsage,
      usageRate: (usedFeatures / totalFeatures) * 100,
    };
  }, [features]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const categories = [...new Set(features.map(f => f.category))];
    return categories.map(category => {
      const categoryFeatures = getCategoryStats(category);
      const usedCount = categoryFeatures.filter(f => f.usageCount > 0).length;
      const totalCount = categoryFeatures.length;
      const totalUsage = categoryFeatures.reduce((sum, f) => sum + f.usageCount, 0);

      return {
        category,
        usedCount,
        totalCount,
        totalUsage,
        usageRate: (usedCount / totalCount) * 100,
      };
    });
  }, [features, getCategoryStats]);

  // Chart data for most used features
  const mostUsedChartData = useMemo(() => {
    return getMostUsedFeatures(10).map(feature => ({
      name: feature.name.length > 20 ? feature.name.substring(0, 20) + '...' : feature.name,
      usage: feature.usageCount,
      category: feature.category,
    }));
  }, [getMostUsedFeatures]);

  // Pie chart data for category usage
  const categoryPieData = useMemo(() => {
    return categoryData.map((cat, index) => ({
      name: cat.category,
      value: cat.totalUsage,
      color: COLORS[index % COLORS.length],
    }));
  }, [categoryData]);

  const filteredFeatures = useMemo(() => {
    if (selectedCategory === 'all') return features;
    return getCategoryStats(selectedCategory);
  }, [selectedCategory, features, getCategoryStats]);

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      stats,
      categories: categoryData,
      features: features.map(f => ({
        ...f,
        lastUsed: f.lastUsed?.toISOString(),
        firstUsed: f.firstUsed?.toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeatures}</div>
            <p className="text-xs text-muted-foreground">
              Available features
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Features Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usedFeatures}</div>
            <p className="text-xs text-muted-foreground">
              {stats.usageRate.toFixed(1)}% adoption rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unused Features</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unusedFeatures}</div>
            <p className="text-xs text-muted-foreground">
              Not yet explored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              Avg {stats.avgUsage.toFixed(1)} per feature
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Features Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Most Used Features</CardTitle>
            <CardDescription>Top 10 features by usage count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mostUsedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usage" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Usage Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Category</CardTitle>
            <CardDescription>Feature usage distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Feature List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feature Usage Details</CardTitle>
              <CardDescription>
                Detailed breakdown of all features and their usage statistics
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Usage Data</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all usage analytics data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={resetUsageData}>
                      Reset Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="all">All</TabsTrigger>
              {categoryData.map(cat => (
                <TabsTrigger key={cat.category} value={cat.category}>
                  {cat.category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="space-y-4">
              <div className="grid gap-4">
                {filteredFeatures.map(feature => (
                  <Card key={feature.featureId} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{feature.name}</h4>
                          <Badge variant={feature.usageCount > 0 ? "default" : "secondary"}>
                            {feature.usageCount > 0 ? "Used" : "Unused"}
                          </Badge>
                          <Badge variant="outline">{feature.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {feature.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Usage Count:</span>
                            <span className="ml-2">{feature.usageCount}</span>
                          </div>
                          {feature.firstUsed && (
                            <div>
                              <span className="font-medium">First Used:</span>
                              <span className="ml-2">
                                {feature.firstUsed.toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {feature.lastUsed && (
                            <div>
                              <span className="font-medium">Last Used:</span>
                              <span className="ml-2">
                                {feature.lastUsed.toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Status:</span>
                            <span className={`ml-2 ${feature.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                              {feature.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="w-24">
                          <Progress
                            value={(feature.usageCount / Math.max(stats.totalUsage * 0.1, 1)) * 100}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Unused Features Alert */}
      {stats.unusedFeatures > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-800">Unused Features</CardTitle>
            </div>
            <CardDescription className="text-orange-700">
              {stats.unusedFeatures} features haven't been used yet. Consider exploring these capabilities:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {getUnusedFeatures().slice(0, 5).map(feature => (
                <div key={feature.featureId} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{feature.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({feature.category})
                    </span>
                  </div>
                  <Badge variant="outline">Not used</Badge>
                </div>
              ))}
              {getUnusedFeatures().length > 5 && (
                <p className="text-sm text-muted-foreground">
                  ...and {getUnusedFeatures().length - 5} more unused features
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};