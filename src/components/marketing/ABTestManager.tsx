import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

const TEMPLATE_A = "Hi {name}! Cash offer for your property at {address}. Click to see your offer.";
const TEMPLATE_B = "🏠 {name}, we want your house at {address}! Get your cash offer now.";

function getRandomTemplate() {
  return Math.random() < 0.5 ? 'A' : 'B';
}

export default function ABTestManager({ leads }) {
  const [results, setResults] = useState({ A: { sent: 0, open: 0, click: 0 }, B: { sent: 0, open: 0, click: 0 } });
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    // Fetch stats from Supabase (simulate)
    async function fetchStats() {
      // Replace with real queries
      const { data } = await supabase.from('ab_test_stats').select('*');
      if (data) {
        setResults({
          A: { sent: data[0]?.a_sent || 0, open: data[0]?.a_open || 0, click: data[0]?.a_click || 0 },
          B: { sent: data[0]?.b_sent || 0, open: data[0]?.b_open || 0, click: data[0]?.b_click || 0 },
        });
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
      const template = templateType === 'A' ? TEMPLATE_A : TEMPLATE_B;
      // Send message logic here (email/sms)
      // Log send in Supabase
      await supabase.from('ab_test_stats').upsert({
        id: 1,
        [`${templateType.toLowerCase()}_sent`]: results[templateType].sent + 1,
      });
    }
  }

  return (
    <div className="p-4 border rounded">
      <h2 className="font-bold mb-2">A/B Test Manager 🧪</h2>
      <div className="mb-2">
        <div>Template A: <span className="font-mono">{TEMPLATE_A}</span></div>
        <div>Template B: <span className="font-mono">{TEMPLATE_B}</span></div>
      </div>
      <button onClick={sendCampaign} className="btn btn-primary mb-4">Send Campaign (A/B)</button>
      <div className="mb-2">Results after {results.A.sent + results.B.sent} sends:</div>
      <ul>
        <li>A: {results.A.open}% open, {results.A.click}% click</li>
        <li>B: {results.B.open}% open, {results.B.click}% click {winner === 'B' && <b>← WINNER ✓</b>}</li>
      </ul>
      {winner && <div className="mt-2 text-green-600 font-bold">Winner: Template {winner} (auto-applied)</div>}
    </div>
  );
}
