import { useState, useEffect } from "react";
import { Eye, Users, TrendingUp } from "lucide-react";

interface SocialProofBannerProps {
  propertyId: string;
}

const SocialProofBanner = ({ propertyId }: SocialProofBannerProps) => {
  const [viewCount, setViewCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);

  useEffect(() => {
    // Simulate realistic view count based on property
    const baseViews = Math.floor(Math.random() * 15) + 5;
    setViewCount(baseViews);

    // Generate realistic activity messages
    const activities = [
      "Someone from Miami viewed this offer 2 minutes ago",
      "A homeowner requested similar offer details today",
      "3 people saved this property this week",
      "Last inquiry received 4 hours ago",
      "This offer has been viewed 12 times today"
    ];
    setRecentActivity(activities);

    // Rotate through activities
    const rotationInterval = setInterval(() => {
      setCurrentActivityIndex(prev => (prev + 1) % activities.length);
    }, 5000);

    // Occasionally increment view count
    const viewInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setViewCount(prev => prev + 1);
      }
    }, 30000);

    return () => {
      clearInterval(rotationInterval);
      clearInterval(viewInterval);
    };
  }, [propertyId]);

  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Live Viewers */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Eye className="w-5 h-5 text-primary" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-medium text-foreground">
            <span className="text-primary font-bold">{viewCount}</span> people viewing this offer
          </span>
        </div>

        {/* Recent Activity */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="animate-fade-in" key={currentActivityIndex}>
            {recentActivity[currentActivityIndex]}
          </span>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-1 text-success text-sm font-medium">
          <TrendingUp className="w-4 h-4" />
          <span>High Interest</span>
        </div>
      </div>
    </div>
  );
};

export default SocialProofBanner;
