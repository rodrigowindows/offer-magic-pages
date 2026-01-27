import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

interface LogsPanelProps {
  logs: LogEntry[];
  onClear: () => void;
  onClose?: () => void;
  show?: boolean;
}

const levelColors: Record<string, string> = {
  info: '#2563eb',
  warn: '#f59e42',
  error: '#dc2626',
  debug: '#6b7280',
};

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs, onClear, onClose, show = true }) => {
  const lastLogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (lastLogRef.current) {
      lastLogRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Filtros por nível
  const [filter, setFilter] = React.useState<string>('all');
  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;
    return logs.filter(l => l.level === filter);
  }, [logs, filter]);

  return show ? (
    <Card style={{ margin: '16px 0', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
      <CardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>Logs</span>
          <div>
            <Button size="sm" variant="outline" onClick={onClear} style={{ marginRight: 8 }}>Limpar</Button>
            {onClose && <Button size="sm" variant="ghost" onClick={onClose}>Fechar</Button>}
          </div>
        </div>
        <div style={{ margin: '8px 0' }}>
          <label style={{ fontSize: 12, marginRight: 8 }}>Filtrar:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ fontSize: 12 }}>
            <option value="all">Todos</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
        </div>
        <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 8 }}>
          {filteredLogs.length === 0 ? (
            <span style={{ color: '#6b7280' }}>Nenhum log capturado.</span>
          ) : (
            filteredLogs.map((log, idx) => (
              <div key={idx} ref={idx === filteredLogs.length - 1 ? lastLogRef : undefined} style={{ fontSize: 12, marginBottom: 4, color: levelColors[log.level] || '#2563eb', borderLeft: `3px solid ${levelColors[log.level] || '#2563eb'}`, paddingLeft: 6, background: log.level === 'error' ? '#fef2f2' : log.level === 'warn' ? '#fff7ed' : log.level === 'debug' ? '#f3f4f6' : '#f1f5f9' }}>
                <span style={{ fontWeight: 500 }}>{log.timestamp}</span> <span>[{log.level}]</span> <span>{log.message}</span>
                {log.data && <pre style={{ margin: 0, fontSize: 11, color: '#374151', background: '#f3f4f6', borderRadius: 4 }}>{JSON.stringify(log.data, null, 2)}</pre>}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  ) : null;
};
