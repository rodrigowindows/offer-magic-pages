import { CheckCircle, XCircle } from 'lucide-react';
import { REJECTION_REASONS } from './constants';

interface StatusBannerProps {
  approvalStatus: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  rejectionNotes: string | null;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export const PropertyStatusBanner = ({
  approvalStatus,
  approvedByName,
  approvedAt,
  rejectionReason,
  rejectionNotes,
}: StatusBannerProps) => {
  if (!approvedByName) return null;

  if (approvalStatus === 'approved') {
    return (
      <div className="px-2 py-1 bg-green-100 dark:bg-green-950/60 border border-green-300 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <span className="text-xs font-bold text-green-800">APROVADO</span>
          <span className="text-[10px] text-green-700">
            por {approvedByName}
            {approvedAt && <> — {formatDate(approvedAt)}</>}
          </span>
        </div>
        {rejectionNotes && (
          <p className="text-[10px] text-green-700 mt-0.5 italic">{rejectionNotes}</p>
        )}
      </div>
    );
  }

  if (approvalStatus === 'rejected') {
    return (
      <div className="px-2 py-1 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-1">
          <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
          <span className="text-xs font-bold text-red-800">REJEITADO</span>
          {rejectionReason && (
            <span className="text-[10px] text-red-700 font-semibold">
              — {REJECTION_REASONS.find(r => r.value === rejectionReason)?.label || rejectionReason}
            </span>
          )}
        </div>
        <span className="text-[10px] text-red-600">
          por {approvedByName}
          {approvedAt && <> — {formatDate(approvedAt)}</>}
        </span>
        {rejectionNotes && (
          <p className="text-[10px] text-red-700 mt-0.5 italic">{rejectionNotes}</p>
        )}
      </div>
    );
  }

  return null;
};
