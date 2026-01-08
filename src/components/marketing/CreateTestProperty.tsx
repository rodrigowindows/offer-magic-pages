/**
 * CreateTestProperty - Component for creating test properties
 * Generates realistic test data for campaign testing
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Home,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Test data generators
const orlandoAddresses = [
  '123 Oak Street', '456 Pine Avenue', '789 Maple Drive', '321 Elm Road',
  '654 Birch Lane', '987 Cedar Court', '147 Willow Way', '258 Spruce Street',
  '369 Palm Avenue', '741 Magnolia Drive', '852 Cypress Road', '963 Juniper Lane'
];

const ownerNames = [
  'John Smith', 'Maria Garcia', 'Robert Johnson', 'Lisa Williams', 'Michael Brown',
  'Jennifer Davis', 'David Miller', 'Linda Wilson', 'James Moore', 'Patricia Taylor',
  'Christopher Anderson', 'Susan Thomas', 'Daniel Jackson', 'Margaret White', 'Paul Harris'
];

const generateTestProperty = () => {
  const address = orlandoAddresses[Math.floor(Math.random() * orlandoAddresses.length)];
  const ownerName = ownerNames[Math.floor(Math.random() * ownerNames.length)];
  const baseValue = Math.floor(Math.random() * 500000) + 200000; // $200k - $700k
  const cashOffer = Math.floor(baseValue * 0.65); // 65% of estimated value

  return {
    slug: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    address,
    city: 'Orlando',
    state: 'FL',
    zip_code: (32801 + Math.floor(Math.random() * 99)).toString(),
    property_image_url: `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop&q=80&sig=${Math.random()}`,
    estimated_value: baseValue,
    cash_offer_amount: cashOffer,
    status: 'active',
    owner_name: ownerName,
    owner_phone: `+1 (407) 555-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
    owner_email: `${ownerName.toLowerCase().replace(' ', '.')}@example.com`,
    approval_status: 'approved'
  };
};

export const CreateTestProperty = () => {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message?: string;
    property?: any;
  }>({ status: 'idle' });

  const createTestProperty = async () => {
    setCreating(true);
    setResult({ status: 'idle' });

    try {
      console.log('🧪 Creating test property...');

      const testProperty = generateTestProperty();
      console.log('📝 Generated test property:', testProperty);

      const { data, error } = await supabase
        .from('properties')
        .insert(testProperty)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Test property created:', data);
      setResult({
        status: 'success',
        message: 'Test property created successfully!',
        property: data
      });

      toast({
        title: 'Test Property Created',
        description: `${testProperty.address} - Ready for campaign testing`,
      });

    } catch (error: any) {
      console.error('❌ Error creating test property:', error);
      setResult({
        status: 'error',
        message: error.message || 'Failed to create test property'
      });

      toast({
        title: 'Error Creating Test Property',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">Create Test Property</CardTitle>
        </div>
        <CardDescription>
          Generate a realistic test property with approved status for campaign testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="w-4 h-4" />
          <span>Creates approved properties in Orlando, FL with realistic data</span>
        </div>

        <Button
          onClick={createTestProperty}
          disabled={creating}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Test Property...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Test Property
            </>
          )}
        </Button>

        {result.status === 'success' && result.property && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="font-medium">Property Created Successfully!</div>
              <div className="text-sm mt-1">
                <strong>{result.property.address}</strong> - {result.property.city}, {result.property.state}
                <br />
                Owner: {result.property.owner_name}
                <br />
                Cash Offer: ${result.property.cash_offer_amount?.toLocaleString()}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {result.status === 'error' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {result.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Properties are created with "approved" status</div>
          <div>• Includes realistic owner contact information</div>
          <div>• Ready for immediate campaign testing</div>
        </div>
      </CardContent>
    </Card>
  );
};