import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import dashboardBg from "@/assets/dashboard-bg.jpg";

interface Message {
  id: string;
  content: string;
  is_user_message: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  chat_messages?: Message[];
}

const ChatHistory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
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
          chat_messages(id, content, is_user_message, created_at)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
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

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
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
        <Header />

        {/* Content */}
        <div className="flex-1 flex">
          {/* Conversations List */}
          <div className="w-80 border-r border-white/20 p-4">
            <h2 className="text-white font-semibold mb-4">Conversations</h2>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center text-white/70 py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <Card 
                      key={conversation.id} 
                      className={`bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-colors cursor-pointer ${
                        selectedConversation?.id === conversation.id ? 'ring-2 ring-neon-cyan' : ''
                      }`}
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white text-sm font-medium truncate">{conversation.title}</h3>
                          <span className="text-white/50 text-xs">{conversation.chat_messages?.length || 0}</span>
                        </div>
                        <p className="text-white/60 text-xs">
                          {formatDate(conversation.updated_at)}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-white/20">
                  <h2 className="text-white font-semibold">{selectedConversation.title}</h2>
                  <p className="text-white/60 text-sm">{formatDate(selectedConversation.updated_at)}</p>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 max-w-4xl">
                    {selectedConversation.chat_messages?.length === 0 ? (
                      <div className="text-center text-white/70 py-8">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No messages in this conversation</p>
                      </div>
                    ) : (
                      selectedConversation.chat_messages?.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.is_user_message ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                              message.is_user_message
                                ? 'bg-neon-cyan text-electric-dark'
                                : 'bg-white/10 text-electric-light backdrop-blur-sm border border-white/20'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.is_user_message ? 'text-electric-dark/70' : 'text-white/60'
                            }`}>
                              {formatDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-white/50" />
                    <h3 className="text-lg font-semibold text-white mb-2">Select a Conversation</h3>
                    <p className="text-white/70 mb-4">Choose a conversation from the list to view its messages.</p>
                    <Button
                      onClick={() => navigate('/chat')}
                      className="bg-neon-cyan text-electric-dark hover:bg-neon-cyan/90 font-medium"
                    >
                      Start New Chat
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;