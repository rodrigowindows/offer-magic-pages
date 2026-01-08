import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Info, X, TrendingUp, Users, Target, BarChart3 } from 'lucide-react';

interface SmartToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  metrics?: {
    sent?: number;
    delivered?: number;
    opened?: number;
    clicked?: number;
  };
}

export const SmartToast = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
  metrics
}: SmartToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            setIsVisible(false);
            onClose?.();
            return 0;
          }
          return prev - (100 / (duration / 100));
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          border: 'border-green-200',
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          iconBg: 'bg-green-100',
          titleColor: 'text-green-900',
          messageColor: 'text-green-800'
        };
      case 'error':
        return {
          border: 'border-red-200',
          bg: 'bg-gradient-to-r from-red-50 to-pink-50',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          iconBg: 'bg-red-100',
          titleColor: 'text-red-900',
          messageColor: 'text-red-800'
        };
      case 'warning':
        return {
          border: 'border-yellow-200',
          bg: 'bg-gradient-to-r from-yellow-50 to-orange-50',
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-800'
        };
      case 'info':
        return {
          border: 'border-blue-200',
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          icon: <Info className="h-5 w-5 text-blue-600" />,
          iconBg: 'bg-blue-100',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-800'
        };
    }
  };

  const styles = getTypeStyles();

  if (!isVisible) return null;

  return (
    <Card className={`fixed top-4 right-4 z-50 w-96 border-2 ${styles.border} ${styles.bg} shadow-2xl animate-in slide-in-from-right-2 fade-in-0`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${styles.iconBg} flex-shrink-0`}>
            {styles.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`font-semibold text-sm ${styles.titleColor}`}>
                {title}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsVisible(false);
                  onClose?.();
                }}
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <p className={`text-sm ${styles.messageColor} mb-3`}>
              {message}
            </p>

            {/* Campaign Metrics */}
            {metrics && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {metrics.sent !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{metrics.sent}</div>
                    <div className="text-xs text-gray-600">Sent</div>
                  </div>
                )}
                {metrics.delivered !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{metrics.delivered}</div>
                    <div className="text-xs text-gray-600">Delivered</div>
                  </div>
                )}
                {metrics.opened !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{metrics.opened}</div>
                    <div className="text-xs text-gray-600">Opened</div>
                  </div>
                )}
                {metrics.clicked !== undefined && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{metrics.clicked}</div>
                    <div className="text-xs text-gray-600">Clicked</div>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            {action && (
              <Button
                size="sm"
                onClick={action.onClick}
                className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
              >
                {action.label}
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {duration > 0 && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Campaign Success Toast
export const CampaignSuccessToast = ({ campaignName, propertiesCount, onViewReport }: {
  campaignName: string;
  propertiesCount: number;
  onViewReport?: () => void;
}) => (
  <SmartToast
    type="success"
    title="Campaign Launched Successfully! 🚀"
    message={`Your ${campaignName} campaign has been sent to ${propertiesCount} properties. Track performance in real-time.`}
    action={onViewReport ? {
      label: "View Report",
      onClick: onViewReport
    } : undefined}
    metrics={{
      sent: propertiesCount,
      delivered: Math.floor(propertiesCount * 0.95),
      opened: Math.floor(propertiesCount * 0.25),
      clicked: Math.floor(propertiesCount * 0.08)
    }}
  />
);

// Campaign Error Toast
export const CampaignErrorToast = ({ error, onRetry }: {
  error: string;
  onRetry?: () => void;
}) => (
  <SmartToast
    type="error"
    title="Campaign Launch Failed"
    message={error}
    action={onRetry ? {
      label: "Retry",
      onClick: onRetry
    } : undefined}
  />
);

// Achievement Toast
export const AchievementToast = ({ achievement, description }: {
  achievement: string;
  description: string;
}) => (
  <SmartToast
    type="success"
    title={`🏆 ${achievement}`}
    message={description}
    duration={8000}
  />
);