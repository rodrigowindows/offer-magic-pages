/**
 * Offer Management Dashboard
 * Complete interface for managing property cash offers
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Home,
  Phone,
  Mail,
  Calendar,
  BarChart3
} from 'lucide-react';
import { PropertyOffer } from './PropertyOffer';
import { PropertyOfferService, type PropertyOfferData } from '@/services/propertyOfferService';
import { useToast } from '@/hooks/use-toast';

export const OfferManagementDashboard = () => {
  const [offers, setOffers] = useState<PropertyOfferData[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<PropertyOfferData[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<PropertyOfferData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalOffers: 0,
    sentOffers: 0,
    acceptedOffers: 0,
    conversionRate: 0,
    averageResponseTime: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadOffers();
    loadAnalytics();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [offers, searchTerm, statusFilter]);

  const loadOffers = async () => {
    try {
      // In a real implementation, fetch from database
      // For now, we'll use mock data
      const mockOffers: PropertyOfferData[] = [
        {
          id: 'offer_001',
          propertyId: 'prop_001',
          offerAmount: 70000,
          estimatedValue: 85000,
          closingDays: 14,
          status: 'sent',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
          recipientName: 'John Smith',
          recipientEmail: 'john.smith@email.com',
          recipientPhone: '(555) 123-4567',
          agentName: 'Sarah Johnson',
          agentEmail: 'sarah@localcashbuyer.com',
          agentPhone: '(555) 987-6543',
          property: {
            address: '144 WASHINGTON AVE',
            city: 'EATONVILLE',
            state: 'FL',
            zipCode: '32751',
            propertyType: 'Single Family Home',
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1200
          }
        },
        {
          id: 'offer_002',
          propertyId: 'prop_002',
          offerAmount: 95000,
          estimatedValue: 110000,
          closingDays: 10,
          status: 'accepted',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          recipientName: 'Maria Garcia',
          recipientEmail: 'maria.garcia@email.com',
          recipientPhone: '(555) 234-5678',
          agentName: 'Mike Wilson',
          agentEmail: 'mike@localcashbuyer.com',
          agentPhone: '(555) 876-5432',
          property: {
            address: '789 OAK STREET',
            city: 'ORLANDO',
            state: 'FL',
            zipCode: '32801',
            propertyType: 'Condo',
            bedrooms: 2,
            bathrooms: 2,
            squareFeet: 950
          }
        }
      ];

      setOffers(mockOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive"
      });
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await PropertyOfferService.getOfferAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const filterOffers = () => {
    let filtered = offers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(offer =>
        offer.property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => offer.status === statusFilter);
    }

    setFilteredOffers(filtered);
  };

  const handleCreateOffer = () => {
    setIsCreatingOffer(true);
    // In a real implementation, open a modal or navigate to create offer page
    toast({
      title: "Create Offer",
      description: "Offer creation modal would open here"
    });
  };

  const handleViewOffer = (offer: PropertyOfferData) => {
    setSelectedOffer(offer);
  };

  const handleSendOffer = async (offer: PropertyOfferData) => {
    try {
      const result = await PropertyOfferService.sendOfferCampaign({
        propertyId: offer.propertyId,
        offerAmount: offer.offerAmount,
        estimatedValue: offer.estimatedValue,
        closingDays: offer.closingDays,
        recipientEmail: offer.recipientEmail!,
        recipientName: offer.recipientName,
        recipientPhone: offer.recipientPhone,
        agentName: offer.agentName,
        agentEmail: offer.agentEmail,
        agentPhone: offer.agentPhone
      });

      if (result.success) {
        toast({
          title: "Offer Sent",
          description: "Offer campaign has been sent successfully"
        });
        loadOffers(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send offer",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = async (offer: PropertyOfferData) => {
    try {
      await PropertyOfferService.downloadOfferPDF(offer.id);
      toast({
        title: "PDF Downloaded",
        description: "Offer PDF has been downloaded"
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Offer Management</h1>
          <p className="text-muted-foreground">Create, send, and track property cash offers</p>
        </div>
        <Button onClick={handleCreateOffer} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Offer
        </Button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOffers}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
            <Progress value={analytics.conversionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageResponseTime}d</div>
            <p className="text-xs text-muted-foreground">Days to respond</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Offers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.acceptedOffers}</div>
            <p className="text-xs text-muted-foreground">Out of {analytics.sentOffers} sent</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="offers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="offers">All Offers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="offers" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Offers</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by address, name, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Label htmlFor="status">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offers List */}
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <Card key={offer.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-6 w-6 text-green-600" />
                      <div>
                        <CardTitle className="text-lg">
                          {formatCurrency(offer.offerAmount)}
                        </CardTitle>
                        <CardDescription>
                          {offer.property.address}, {offer.property.city}, {offer.property.state}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(offer.status)}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Recipient</p>
                      <p className="font-medium">{offer.recipientName}</p>
                      <p className="text-muted-foreground">{offer.recipientEmail}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{offer.createdAt.toLocaleDateString()}</p>
                      <p className="text-muted-foreground">
                        Expires: {offer.expiresAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Agent</p>
                      <p className="font-medium">{offer.agentName}</p>
                      <p className="text-muted-foreground">{offer.agentPhone}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewOffer(offer)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>

                    {offer.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleSendOffer(offer)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Offer
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPDF(offer)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>

                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>

                    <Button size="sm" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredOffers.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No offers found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Create your first property offer to get started'
                    }
                  </p>
                  <Button onClick={handleCreateOffer}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Offer
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Offer Performance</CardTitle>
                <CardDescription>Conversion rates and response times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Conversion Rate</span>
                    <span className="font-bold">{analytics.conversionRate}%</span>
                  </div>
                  <Progress value={analytics.conversionRate} />

                  <div className="flex justify-between items-center">
                    <span>Average Response Time</span>
                    <span className="font-bold">{analytics.averageResponseTime} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Offer Status Breakdown</CardTitle>
                <CardDescription>Current status of all offers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      Sent
                    </span>
                    <span>{analytics.sentOffers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      Accepted
                    </span>
                    <span>{analytics.acceptedOffers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      Pending
                    </span>
                    <span>{analytics.totalOffers - analytics.sentOffers - analytics.acceptedOffers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offer Templates</CardTitle>
              <CardDescription>Pre-configured offer templates for different scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Standard Cash Offer</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Basic cash offer with standard terms and 14-day closing.
                    </p>
                    <Badge>Most Popular</Badge>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Fast Close Offer</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Accelerated timeline with 7-day closing for motivated sellers.
                    </p>
                    <Badge variant="secondary">Quick Close</Badge>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Premium Offer</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Higher offer amounts for competitive situations.
                    </p>
                    <Badge variant="outline">Premium</Badge>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Offer Detail Modal/View */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Offer Details</h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedOffer(null)}
                >
                  ✕
                </Button>
              </div>

              <PropertyOffer
                property={selectedOffer.property}
                onAcceptOffer={(id, amount) => {
                  PropertyOfferService.acceptOffer(id, 'user');
                  setSelectedOffer(null);
                }}
                onContactQuestions={(id) => {
                  PropertyOfferService.handleOfferQuestions(id, 'email');
                }}
                onDownloadPDF={(id) => {
                  PropertyOfferService.downloadOfferPDF(id);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};