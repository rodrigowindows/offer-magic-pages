/**
 * Main Navigation Component
 * Global navigation menu to access all parts of the application
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Home,
  Building2,
  Mail,
  UserCircle,
  Shield,
  Upload,
  Menu,
  LayoutDashboard,
  Send,
  History,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  title: string;
  href: string;
  description: string;
  icon: React.ElementType;
}

const publicPages: NavigationItem[] = [
  {
    title: 'Home',
    href: '/',
    description: 'Main landing page for property owners',
    icon: Home,
  },
  {
    title: 'Property Details',
    href: '/property/sample',
    description: 'View property offer details',
    icon: Building2,
  },
];

const adminPages: NavigationItem[] = [
  {
    title: 'Admin Dashboard',
    href: '/admin',
    description: 'Manage properties and offers',
    icon: Shield,
  },
  {
    title: 'Import Properties',
    href: '/admin/import',
    description: 'Bulk import from CSV',
    icon: Upload,
  },
];

const marketingPages: NavigationItem[] = [
  {
    title: 'Marketing Dashboard',
    href: '/marketing',
    description: 'View communication statistics',
    icon: LayoutDashboard,
  },
  {
    title: 'New Communication',
    href: '/marketing/send',
    description: 'Send SMS, Email, or Calls',
    icon: Send,
  },
  {
    title: 'Communication History',
    href: '/marketing/history',
    description: 'View past communications',
    icon: History,
  },
  {
    title: 'Marketing Settings',
    href: '/marketing/settings',
    description: 'Configure marketing system',
    icon: Settings,
  },
];

const authPages: NavigationItem[] = [
  {
    title: 'Sign In / Sign Up',
    href: '/auth',
    description: 'Team member authentication',
    icon: UserCircle,
  },
];

export const MainNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div
              className="text-xl font-bold cursor-pointer"
              onClick={() => navigate('/')}
            >
              MyLocalInvest
            </div>

            {/* Navigation Menu */}
            <NavigationMenu>
              <NavigationMenuList>
                {/* Public Pages */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Public Pages</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      {publicPages.map((item) => (
                        <NavigationItem
                          key={item.href}
                          item={item}
                          isActive={isActive(item.href)}
                          onClick={() => navigate(item.href)}
                        />
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Marketing System */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-gradient-to-r from-orange-500/10 to-purple-500/10">
                    <Mail className="w-4 h-4 mr-2" />
                    Marketing System
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      {marketingPages.map((item) => (
                        <NavigationItem
                          key={item.href}
                          item={item}
                          isActive={isActive(item.href)}
                          onClick={() => navigate(item.href)}
                        />
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Admin Pages */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4">
                      {adminPages.map((item) => (
                        <NavigationItem
                          key={item.href}
                          item={item}
                          isActive={isActive(item.href)}
                          onClick={() => navigate(item.href)}
                        />
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Auth */}
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/auth')}
                      className={cn(
                        'h-10 px-4',
                        isActive('/auth') && 'bg-accent'
                      )}
                    >
                      <UserCircle className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div
            className="text-lg font-bold cursor-pointer"
            onClick={() => navigate('/')}
          >
            MyLocalInvest
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>
                  Access all areas of the application
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Public Pages */}
                <MobileMenuSection
                  title="Public Pages"
                  items={publicPages}
                  isActive={isActive}
                  navigate={navigate}
                  onClose={() => setMobileMenuOpen(false)}
                />

                {/* Marketing System */}
                <MobileMenuSection
                  title="Marketing System"
                  items={marketingPages}
                  isActive={isActive}
                  navigate={navigate}
                  onClose={() => setMobileMenuOpen(false)}
                  highlight
                />

                {/* Admin Pages */}
                <MobileMenuSection
                  title="Admin"
                  items={adminPages}
                  isActive={isActive}
                  navigate={navigate}
                  onClose={() => setMobileMenuOpen(false)}
                />

                {/* Auth */}
                <MobileMenuSection
                  title="Account"
                  items={authPages}
                  isActive={isActive}
                  navigate={navigate}
                  onClose={() => setMobileMenuOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
};

// Navigation Item Component
const NavigationItem = ({
  item,
  isActive,
  onClick,
}: {
  item: NavigationItem;
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = item.icon;

  return (
    <li>
      <NavigationMenuLink asChild>
        <button
          onClick={onClick}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left',
            isActive && 'bg-accent'
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <div className="text-sm font-medium leading-none">{item.title}</div>
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        </button>
      </NavigationMenuLink>
    </li>
  );
};

// Mobile Menu Section
const MobileMenuSection = ({
  title,
  items,
  isActive,
  navigate,
  onClose,
  highlight = false,
}: {
  title: string;
  items: NavigationItem[];
  isActive: (href: string) => boolean;
  navigate: (href: string) => void;
  onClose: () => void;
  highlight?: boolean;
}) => {
  return (
    <div>
      <h3
        className={cn(
          'mb-2 text-sm font-semibold text-muted-foreground',
          highlight && 'text-orange-600'
        )}
      >
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.href}
              variant={isActive(item.href) ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => {
                navigate(item.href);
                onClose();
              }}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.title}
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default MainNavigation;
