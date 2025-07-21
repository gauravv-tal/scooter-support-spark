import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import dashboardBg from "@/assets/dashboard-bg.jpg";

interface CustomerQuery {
  id: string;
  query_text: string;
  status: string;
  admin_response?: string;
  created_at: string;
  response_date?: string;
}

const SupportQueries = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadQueries();
    }
  }, [user]);

  const loadQueries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customer_queries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQueries(data || []);
    } catch (error) {
      console.error('Error loading queries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'responded':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading || isLoading) {
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
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${dashboardBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="max-w-4xl mx-auto">
            {queries.length === 0 ? (
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-white/50" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Support Queries</h3>
                  <p className="text-white/70 mb-4">You haven't submitted any queries yet.</p>
                  <Button
                    onClick={() => navigate('/chat')}
                    className="bg-neon-cyan text-electric-dark hover:bg-neon-cyan/90 font-medium"
                  >
                    Start Chat
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {queries.map((query) => (
                  <Card key={query.id} className="bg-white/10 border-white/20 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          Support Query
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(query.status)}>
                            {query.status === 'responded' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {query.status}
                          </Badge>
                          <span className="text-white/60 text-sm">
                            {formatDate(query.created_at)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-white font-medium mb-2">Your Query:</h4>
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-white/90">{query.query_text}</p>
                        </div>
                      </div>
                      
                      {query.admin_response ? (
                        <div>
                          <h4 className="text-white font-medium mb-2">Support Response:</h4>
                          <div className="bg-neon-cyan/10 rounded-lg p-3 border border-neon-cyan/30">
                            <p className="text-white/90">{query.admin_response}</p>
                            {query.response_date && (
                              <p className="text-white/60 text-sm mt-2">
                                Responded on {formatDate(query.response_date)}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-white font-medium mb-2">Support Response:</h4>
                          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <p className="text-white/70">Thanks for submitting your questions, support team soon will respond on it</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportQueries;