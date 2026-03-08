/**
 * Conversion Funnel Analytics Component
 * Shows lead progression: Imported → Contacted → Responded → Approved → Closed
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, TrendingUp, Users, Mail, MessageSquare, CheckCircle, DollarSign } from 'lucide-react';

interface FunnelStage {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

export const ConversionFunnel = () => {
  const [data, setData] = useState({
    totalProperties: 0,
    contacted: 0,
    responded: 0,
    approved: 0,
    leadsCaptured: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunnelData = async () => {
      try {
        const [totalRes, contactedRes, respondedRes, approvedRes, capturedRes] = await Promise.all([
          supabase.from('properties').select('*', { count: 'exact', head: true }),
          supabase.from('properties').select('*', { count: 'exact', head: true })
            .or('sms_sent.eq.true,email_sent.eq.true,phone_call_made.eq.true,letter_sent.eq.true'),
          supabase.from('properties').select('*', { count: 'exact', head: true })
            .eq('answer_flag', true),
          supabase.from('properties').select('*', { count: 'exact', head: true })
            .eq('approval_status', 'approved'),
          supabase.from('properties').select('*', { count: 'exact', head: true })
            .eq('lead_captured', true),
        ]);

        setData({
          totalProperties: totalRes.count || 0,
          contacted: contactedRes.count || 0,
          responded: respondedRes.count || 0,
          approved: approvedRes.count || 0,
          leadsCaptured: capturedRes.count || 0,
        });
      } catch (err) {
        console.error('Error fetching funnel data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFunnelData();
  }, []);

  const stages: FunnelStage[] = useMemo(() => [
    { label: 'Imported', count: data.totalProperties, icon: <Users className="w-4 h-4" />, color: 'bg-blue-500' },
    { label: 'Contacted', count: data.contacted, icon: <Mail className="w-4 h-4" />, color: 'bg-indigo-500' },
    { label: 'Responded', count: data.responded, icon: <MessageSquare className="w-4 h-4" />, color: 'bg-amber-500' },
    { label: 'Leads', count: data.leadsCaptured, icon: <TrendingUp className="w-4 h-4" />, color: 'bg-orange-500' },
    { label: 'Approved', count: data.approved, icon: <CheckCircle className="w-4 h-4" />, color: 'bg-emerald-500' },
  ], [data]);

  const conversionRate = (from: number, to: number) =>
    from > 0 ? ((to / from) * 100).toFixed(1) + '%' : '—';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse flex gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-1 h-24 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {stages.map((stage, idx) => (
            <div key={stage.label} className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex-1 text-center">
                <div className={`${stage.color} text-white rounded-lg p-3 mb-1`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {stage.icon}
                    <span className="text-xs font-medium">{stage.label}</span>
                  </div>
                  <div className="text-xl font-bold">{stage.count.toLocaleString()}</div>
                </div>
                {idx > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    {conversionRate(stages[idx - 1].count, stage.count)}
                  </div>
                )}
              </div>
              {idx < stages.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Summary row */}
        <div className="flex gap-4 mt-4 pt-3 border-t text-sm text-muted-foreground">
          <div>
            Overall: <strong className="text-foreground">{conversionRate(data.totalProperties, data.approved)}</strong>
          </div>
          <div>
            Contact → Response: <strong className="text-foreground">{conversionRate(data.contacted, data.responded)}</strong>
          </div>
          <div>
            Response → Lead: <strong className="text-foreground">{conversionRate(data.responded, data.leadsCaptured)}</strong>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
