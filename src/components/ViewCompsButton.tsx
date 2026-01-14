/**
 * View Comps Button Component
 * Quick access button to navigate to Comps Analysis from any property view
 */

import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ViewCompsButtonProps {
  propertyId?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ViewCompsButton = ({
  propertyId,
  variant = 'outline',
  size = 'sm',
  className = ''
}: ViewCompsButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to comps page, optionally with property ID in query params
    if (propertyId) {
      navigate(`/marketing/comps?property=${propertyId}`);
    } else {
      navigate('/marketing/comps');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      title="View comparable properties analysis"
    >
      <Home className="w-4 h-4 mr-2" />
      View Comps
    </Button>
  );
};

export default ViewCompsButton;
