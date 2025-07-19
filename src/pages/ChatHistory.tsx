import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, MessageSquare, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import gangesLogo from "@/assets/ganges-logo.png";
import dashboardBg from "@/assets/dashboard-bg.jpg";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message?: string;
}

const ChatHistory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          chat_messages(content, created_at)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithCounts = data?.map(conv => ({
        ...conv,
        message_count: conv.chat_messages?.length || 0,
        last_message: conv.chat_messages?.[conv.chat_messages.length - 1]?.content || 'No messages'
      })) || [];

      setConversations(conversationsWithCounts);
    } catch (error) {
      console.error('Error loading conversations:', error);
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

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat?conversation=${conversationId}`);
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
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img src={gangesLogo} alt="Ganges Electric Scooters" className="w-12 h-7 object-contain rounded" />
            <h1 className="text-xl font-bold text-white">Chat History</h1>
          </div>
          <Button
            onClick={() => navigate('/chat')}
            className="bg-neon-cyan text-electric-dark hover:bg-neon-cyan/90 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="max-w-4xl mx-auto">
            {conversations.length === 0 ? (
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-white/50" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Chat History</h3>
                  <p className="text-white/70 mb-4">You haven't started any conversations yet.</p>
                  <Button
                    onClick={() => navigate('/chat')}
                    className="bg-neon-cyan text-electric-dark hover:bg-neon-cyan/90 font-medium"
                  >
                    Start First Chat
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <Card 
                    key={conversation.id} 
                    className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-colors cursor-pointer"
                    onClick={() => handleConversationClick(conversation.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          {conversation.title}
                        </CardTitle>
                        <span className="text-white/60 text-sm">
                          {formatDate(conversation.updated_at)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-white/70 text-sm">
                          <span>{conversation.message_count} messages</span>
                          <span>•</span>
                          <span>Last updated: {formatDate(conversation.updated_at)}</span>
                        </div>
                        <div className="bg-white/5 rounded p-2 border border-white/10">
                          <p className="text-white/80 text-sm truncate">
                            {conversation.last_message}
                          </p>
                        </div>
                      </div>
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

export default ChatHistory;