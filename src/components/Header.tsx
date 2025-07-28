import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import gangesLogo from "@/assets/ganges-logo.png";
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        // For mock users, get role from user metadata
        if (user.id.startsWith('mock-')) {
          setUserRole(user.user_metadata?.role || 'customer');
          return;
        }

        // For real users, get role from database profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        
        setUserRole(profile?.role || 'customer');
      }
    };

    fetchUserRole();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate('/');
    }
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-3">
        <img src={gangesLogo} alt="Ganges Electric Scooters" className="w-20 h-12 object-contain rounded" />
        <h1 className="text-2xl font-bold text-white">Ganges Support</h1>
      </div>
      <div className="flex items-center gap-4">
        {user?.phone && (
          <span className="text-white/80">{user.phone}</span>
        )}
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 rounded-md text-white hover:bg-white/10 focus:outline-none">
            <Menu className="w-7 h-7" />
            <span className="sr-only">Open menu</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate('/dashboard')}>Dashboard</DropdownMenuItem>
          {userRole === 'admin' && (
            <DropdownMenuItem onClick={() => navigate('/add-questions')}>Add Questions</DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => navigate('/support-queries')}>Support Queries</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/chat-history')}>Chat History</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-700">
            <LogOut className="w-4 h-4 mr-2" />Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Header;