import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Package, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import dashboardBg from "@/assets/dashboard-bg.jpg";
import scooterModelsBg from "@/assets/scooter-models-bg.jpg";

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
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


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-electric-light to-electric-dark">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div 
      className="min-h-screen p-4 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${scooterModelsBg}), url(${dashboardBg})`,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundAttachment: 'fixed',
        backgroundBlendMode: 'overlay'
      }}
    >
      <Header />

      <div className="max-w-4xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Welcome back!
              </CardTitle>
              <CardDescription className="text-white/80">
                Phone: {user.phone || 'Not provided'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-2xl mx-auto">
        <Card 
          className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
          onClick={() => navigate('/chat')}
        >
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Ask Questions
            </CardTitle>
            <CardDescription className="text-white/80">
              Get instant answers about your electric scooter, maintenance, and more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-neon-cyan text-electric-dark hover:bg-neon-cyan/90"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/chat');
              }}
            >
              Start Chat
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
          onClick={() => navigate('/orders')}
        >
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Track Orders
            </CardTitle>
            <CardDescription className="text-white/80">
              Check the status of your scooter orders and delivery updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full border-white/30 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/orders');
              }}
            >
              View Orders
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;