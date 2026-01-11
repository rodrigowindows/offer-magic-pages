/**
 * Retell Webhook Tester
 * Test the Retell AI webhook integration with property lookup
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Phone, Loader2, CheckCircle, XCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler';
const PUBLIC_URL = 'https://offer.mylocalinvest.com';

interface TestResult {
  success: boolean;
  result?: {
    event: string;
    call: any;
    property_found: boolean;
    matched_by: string | null;
    property_info: any;
    skip_trace_data: any;
    processed_at: string;
  };
  error?: string;
}

export const RetellWebhookTester = () => {
  const [phoneNumber, setPhoneNumber] = useState('+14075551234');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Add +1 if not present
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }

    return phone;
  };

  const testWebhook = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      const webhookPayload = {
        event: 'call_ended',
        call: {
          call_id: `test-${Date.now()}`,
          from_number: formattedPhone,
          to_number: '+14075559999',
          direction: 'inbound',
          call_type: 'phone_call',
          call_status: 'ended',
          start_timestamp: Date.now() - 120000, // 2 minutes ago
          end_timestamp: Date.now(),
          disconnection_reason: 'user_hangup',
          transcript: 'Test call transcript',
          metadata: {
            test_mode: true,
            tester: 'RetellWebhookTester'
          }
        }
      };

      console.log('Sending webhook test:', webhookPayload);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      const data = await response.json();
      console.log('Webhook response:', data);

      setTestResult(data);

      if (data.success && data.result?.property_found) {
        toast({
          title: '✅ Property Found!',
          description: `Matched property: ${data.result.property_info.address}`,
        });
      } else if (data.success && !data.result?.property_found) {
        toast({
          title: '⚠️ No Property Found',
          description: 'The phone number was not found in the database',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '❌ Test Failed',
          description: data.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast({
        title: '❌ Request Failed',
        description: error instanceof Error ? error.message : 'Network error',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    toast({
      title: 'Copied!',
      description: 'Webhook URL copied to clipboard',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Retell AI Webhook Tester
          </CardTitle>
          <CardDescription>
            Test the Retell webhook integration and property lookup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Webhook URL Info */}
          <div className="space-y-2">
            <Label>Webhook URL (for Retell AI configuration)</Label>
            <div className="flex gap-2">
              <Input
                value={WEBHOOK_URL}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyWebhookUrl}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(PUBLIC_URL, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure this URL in your Retell AI dashboard under Settings → Webhooks
            </p>
          </div>

          <Separator />

          {/* Test Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Test Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (407) 555-1234"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={testing}
                />
                <Button
                  onClick={testWebhook}
                  disabled={testing || !phoneNumber}
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Test Webhook
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a phone number from your properties database to test the lookup
              </p>
            </div>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="space-y-4">
              <Separator />

              {/* Status */}
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-semibold">
                  {testResult.success ? 'Webhook Successful' : 'Webhook Failed'}
                </span>
                {testResult.result && (
                  <Badge variant={testResult.result.property_found ? 'default' : 'secondary'}>
                    {testResult.result.property_found ? 'Property Found' : 'No Match'}
                  </Badge>
                )}
              </div>

              {/* Error */}
              {testResult.error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{testResult.error}</AlertDescription>
                </Alert>
              )}

              {/* Property Info */}
              {testResult.result?.property_info && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Property Information</CardTitle>
                    <CardDescription>
                      Matched by: <Badge variant="outline">{testResult.result.matched_by}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Address:</span>
                        <p className="text-muted-foreground">
                          {testResult.result.property_info.address}, {testResult.result.property_info.city}, {testResult.result.property_info.state} {testResult.result.property_info.zip_code}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Owner:</span>
                        <p className="text-muted-foreground">
                          {testResult.result.property_info.owner_name || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Estimated Value:</span>
                        <p className="text-muted-foreground">
                          ${testResult.result.property_info.estimated_value?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Cash Offer:</span>
                        <p className="text-muted-foreground">
                          ${testResult.result.property_info.cash_offer_amount?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Skip Trace Data */}
              {testResult.result?.skip_trace_data && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Skip Trace Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-sm">Total Phones:</span>
                        <p className="text-2xl font-bold text-blue-600">
                          {testResult.result.skip_trace_data.total_phones}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Total Emails:</span>
                        <p className="text-2xl font-bold text-blue-600">
                          {testResult.result.skip_trace_data.total_emails}
                        </p>
                      </div>
                    </div>

                    {testResult.result.skip_trace_data.preferred_phones?.length > 0 && (
                      <div>
                        <span className="font-medium text-sm">Preferred Phones:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {testResult.result.skip_trace_data.preferred_phones.map((phone: string, idx: number) => (
                            <Badge key={idx} variant="outline">{phone}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {testResult.result.skip_trace_data.preferred_emails?.length > 0 && (
                      <div>
                        <span className="font-medium text-sm">Preferred Emails:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {testResult.result.skip_trace_data.preferred_emails.map((email: string, idx: number) => (
                            <Badge key={idx} variant="outline">{email}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 pt-2">
                      <div>
                        <span className="font-medium text-sm">DNC Status:</span>
                        <Badge
                          variant={testResult.result.skip_trace_data.dnc_status === 'Clear' ? 'default' : 'destructive'}
                          className="ml-2"
                        >
                          {testResult.result.skip_trace_data.dnc_status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Deceased Status:</span>
                        <Badge
                          variant={testResult.result.skip_trace_data.deceased_status === 'Alive' ? 'default' : 'destructive'}
                          className="ml-2"
                        >
                          {testResult.result.skip_trace_data.deceased_status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Property Found */}
              {testResult.success && !testResult.result?.property_found && (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    No property found with phone number: {phoneNumber}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      Make sure the phone number exists in your properties database
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {/* Raw JSON Response */}
              <details className="text-xs">
                <summary className="cursor-pointer font-medium mb-2">
                  View Raw JSON Response
                </summary>
                <pre className="bg-muted p-4 rounded overflow-x-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Configure in Retell AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li>Log in to your Retell AI dashboard</li>
            <li>Go to <strong>Settings</strong> → <strong>Webhooks</strong></li>
            <li>Click <strong>Add Webhook URL</strong></li>
            <li>Paste the webhook URL: <code className="bg-muted px-2 py-1 rounded text-xs">{WEBHOOK_URL}</code></li>
            <li>Select events:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>☑️ call_started</li>
                <li>☑️ call_ended</li>
                <li>☑️ call_analyzed</li>
              </ul>
            </li>
            <li>Click <strong>Save</strong></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default RetellWebhookTester;
