import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import gangesLogo from "@/assets/ganges-logo.png";
import { generateDemoOrdersForExistingUser } from "@/utils/generateDemoForExisting";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 rounded-md text-white hover:bg-white/10 focus:outline-none">
            <Menu className="w-7 h-7" />
            <span className="sr-only">Open menu</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate('/dashboard')}>Dashboard</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/add-questions')}>Add Questions</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/support-queries')}>Support Queries</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/chat-history')}>Chat History</DropdownMenuItem>
          <DropdownMenuItem onClick={generateDemoOrdersForExistingUser}>Generate Demo Orders</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-700">
            <LogOut className="w-4 h-4 mr-2" />Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Header;