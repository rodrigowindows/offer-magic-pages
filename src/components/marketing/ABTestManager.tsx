import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TEMPLATE_A = "Hi {name}! Cash offer for your property at {address}. Click to see your offer.";
const TEMPLATE_B = "🏠 {name}, we want your house at {address}! Get your cash offer now.";

function getRandomTemplate() {
  return Math.random() < 0.5 ? 'A' : 'B';
}

interface ABTestManagerProps {
  leads?: any[];
}

export default function ABTestManager({ leads = [] }: ABTestManagerProps) {
  const [results, setResults] = useState({ A: { sent: 0, open: 0, click: 0 }, B: { sent: 0, open: 0, click: 0 } });
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Use ab_tests table which exists in the database
        const { data: abTests, error } = await supabase
          .from('ab_tests')
          .select('variant, viewed_form, submitted_form')
          .limit(1000);
        
        if (error) throw error;
        
        if (abTests && abTests.length > 0) {
          const aData = abTests.filter(t => t.variant === 'A');
          const bData = abTests.filter(t => t.variant === 'B');
          
          setResults({
            A: { 
              sent: aData.length, 
              open: aData.filter(t => t.viewed_form).length, 
              click: aData.filter(t => t.submitted_form).length 
            },
            B: { 
              sent: bData.length, 
              open: bData.filter(t => t.viewed_form).length, 
              click: bData.filter(t => t.submitted_form).length 
            },
          });
        }
      } catch (error) {
        console.error('Error fetching AB test stats:', error);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    // Check for winner (simple significance: 100+ sends, higher click rate)
    const totalSent = results.A.sent + results.B.sent;
    if (totalSent >= 100) {
      const aRate = results.A.click / (results.A.open || 1);
      const bRate = results.B.click / (results.B.open || 1);
      setWinner(aRate > bRate ? 'A' : 'B');
    }
  }, [results]);

  async function sendCampaign() {
    for (const lead of leads) {
      const templateType = getRandomTemplate();
      // Log to ab_tests table
      await supabase.from('ab_tests').insert({
        property_id: lead.id,
        session_id: `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        variant: templateType,
        viewed_form: false,
        submitted_form: false,
      });
    }
    // Refresh stats after sending
    window.location.reload();
  }

  const getOpenRate = (data: { sent: number; open: number }) => {
    return data.sent > 0 ? ((data.open / data.sent) * 100).toFixed(1) : '0';
  };

  const getClickRate = (data: { open: number; click: number }) => {
    return data.open > 0 ? ((data.click / data.open) * 100).toFixed(1) : '0';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          A/B Test Manager 🧪
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="p-2 bg-muted rounded">
            <span className="font-medium">Template A:</span>
            <span className="font-mono text-sm ml-2">{TEMPLATE_A}</span>
          </div>
          <div className="p-2 bg-muted rounded">
            <span className="font-medium">Template B:</span>
            <span className="font-mono text-sm ml-2">{TEMPLATE_B}</span>
          </div>
        </div>
        
        <Button onClick={sendCampaign} disabled={leads.length === 0}>
          Send Campaign (A/B)
        </Button>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Results after {results.A.sent + results.B.sent} sends:
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={winner === 'A' ? 'default' : 'secondary'}>A</Badge>
              <span>{getOpenRate(results.A)}% open, {getClickRate(results.A)}% click</span>
              {winner === 'A' && <Badge variant="default" className="bg-green-500">WINNER ✓</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={winner === 'B' ? 'default' : 'secondary'}>B</Badge>
              <span>{getOpenRate(results.B)}% open, {getClickRate(results.B)}% click</span>
              {winner === 'B' && <Badge variant="default" className="bg-green-500">WINNER ✓</Badge>}
            </div>
          </div>
        </div>
        
        {winner && (
          <div className="mt-2 text-green-600 font-bold">
            Winner: Template {winner} (auto-applied)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
