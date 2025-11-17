import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant helping with property database management. You can query and update property data. Always confirm before making updates. Use the provided tools to interact with the database.',
          },
          ...messages,
        ],
        tools: [
          {
            type: 'function',
            name: 'query_properties',
            description: 'Query properties from the database. You can filter by lead_status, city, or search by address.',
            parameters: {
              type: 'object',
              properties: {
                lead_status: { type: 'string', description: 'Filter by lead status (e.g., new, contacted, closed)' },
                city: { type: 'string', description: 'Filter by city' },
                search: { type: 'string', description: 'Search in address field' },
                limit: { type: 'number', description: 'Maximum number of results (default 10)' },
              },
            },
          },
          {
            type: 'function',
            name: 'update_property',
            description: 'Update a property by ID. Provide the property ID and fields to update.',
            parameters: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Property ID' },
                updates: { 
                  type: 'object',
                  description: 'Fields to update (e.g., lead_status, cash_offer_amount, owner_phone)',
                },
              },
              required: ['id', 'updates'],
            },
          },
          {
            type: 'function',
            name: 'get_property_stats',
            description: 'Get statistics about properties (counts by status, total values, etc.)',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        ],
        tool_choice: 'auto',
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle streaming response and function calls
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    return new Response(
      new ReadableStream({
        async start(controller) {
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;
              
              const data = line.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
                continue;
              }
              
              try {
                const parsed = JSON.parse(data);
                
                // Check for function calls
                const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
                if (toolCalls) {
                  for (const toolCall of toolCalls) {
                    if (toolCall.function?.name && toolCall.function?.arguments) {
                      const functionName = toolCall.function.name;
                      const args = JSON.parse(toolCall.function.arguments);
                      
                      console.log('Function call:', functionName, args);
                      
                      let result;
                      if (functionName === 'query_properties') {
                        let query = supabase.from('properties').select('*');
                        
                        if (args.lead_status) {
                          query = query.eq('lead_status', args.lead_status);
                        }
                        if (args.city) {
                          query = query.ilike('city', `%${args.city}%`);
                        }
                        if (args.search) {
                          query = query.ilike('address', `%${args.search}%`);
                        }
                        
                        query = query.limit(args.limit || 10);
                        
                        const { data, error } = await query;
                        result = error ? { error: error.message } : { properties: data };
                      } else if (functionName === 'update_property') {
                        const { data, error } = await supabase
                          .from('properties')
                          .update(args.updates)
                          .eq('id', args.id)
                          .select()
                          .single();
                        
                        result = error ? { error: error.message } : { updated: data };
                      } else if (functionName === 'get_property_stats') {
                        const { data, error } = await supabase
                          .from('properties')
                          .select('lead_status, estimated_value, cash_offer_amount');
                        
                        if (!error && data) {
                          const stats = {
                            total_properties: data.length,
                            by_status: data.reduce((acc: any, p: any) => {
                              acc[p.lead_status] = (acc[p.lead_status] || 0) + 1;
                              return acc;
                            }, {}),
                            total_estimated_value: data.reduce((sum: number, p: any) => sum + (p.estimated_value || 0), 0),
                            total_offers: data.reduce((sum: number, p: any) => sum + (p.cash_offer_amount || 0), 0),
                          };
                          result = stats;
                        } else {
                          result = { error: error?.message };
                        }
                      }
                      
                      // Send function result back
                      controller.enqueue(new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          type: 'function_result',
                          function: functionName,
                          result: result,
                        })}\n\n`
                      ));
                    }
                  }
                }
                
                controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
          
          controller.close();
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
        },
      }
    );
  } catch (error) {
    console.error('Admin chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});