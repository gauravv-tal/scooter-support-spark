import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Paperclip, ThumbsDown, MessageSquare, Upload, File, Download, Package, Calendar, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import dashboardBg from "@/assets/dashboard-bg.jpg";

interface Message {
  id: string;
  content: string;
  is_user_message: boolean;
  file_url?: string;
  created_at: string;
}

interface PredefinedQuestion {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

interface ScooterOrder {
  id: string;
  order_number: string;
  scooter_model: string;
  order_status: string;
  order_date: string;
  expected_delivery?: string;
  tracking_number?: string;
}

const Chat = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [predefinedQuestions, setPredefinedQuestions] = useState<PredefinedQuestion[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [submittingQuery, setSubmittingQuery] = useState(false);
  const [orders, setOrders] = useState<ScooterOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Fetch all conversations for the user
  const loadConversations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadPredefinedQuestions();
      loadConversations();
      loadOrders();
      createNewConversation();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  const loadPredefinedQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('predefined_questions')
        .select('*')
        .eq('is_active', true)
        .order('category');

      if (error) throw error;
      setPredefinedQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const loadOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('scooter_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const createNewConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: 'New Chat'
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentConversationId(data.id);
      // Load existing messages for this conversation
      if (data.id) {
        loadMessages();
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const findBestAnswer = (question: string, orderContext?: ScooterOrder): string | null => {
    const lowerQuestion = question.toLowerCase();
    
    // Check if this is an order-specific question
    if (orderContext && (lowerQuestion.includes('order') || lowerQuestion.includes('delivery') || lowerQuestion.includes('status') || lowerQuestion.includes('track'))) {
      if (lowerQuestion.includes('status') || lowerQuestion.includes('where') || lowerQuestion.includes('update')) {
        return `Your order #${orderContext.order_number} for ${orderContext.scooter_model} is currently ${orderContext.order_status}. ${orderContext.expected_delivery ? `Expected delivery: ${new Date(orderContext.expected_delivery).toLocaleDateString()}` : ''} ${orderContext.tracking_number ? `Tracking number: ${orderContext.tracking_number}` : ''}`;
      }
      
      if (lowerQuestion.includes('delivery') || lowerQuestion.includes('when')) {
        return orderContext.expected_delivery 
          ? `Your order #${orderContext.order_number} is expected to be delivered on ${new Date(orderContext.expected_delivery).toLocaleDateString()}.`
          : `Your order #${orderContext.order_number} is currently ${orderContext.order_status}. We'll update you with delivery information soon.`;
      }
      
      if (lowerQuestion.includes('track') || lowerQuestion.includes('tracking')) {
        return orderContext.tracking_number 
          ? `Your tracking number for order #${orderContext.order_number} is: ${orderContext.tracking_number}`
          : `Tracking information for order #${orderContext.order_number} will be available once the order is shipped.`;
      }
      
      // General order info
      return `Order #${orderContext.order_number} - ${orderContext.scooter_model} (Status: ${orderContext.order_status}, Ordered: ${new Date(orderContext.order_date).toLocaleDateString()})`;
    }
    
    // Regular predefined questions matching
    for (const qa of predefinedQuestions) {
      const keywords = qa.question.toLowerCase().split(' ');
      const questionWords = lowerQuestion.split(' ');
      
      const matches = keywords.filter(keyword => 
        questionWords.some(word => word.includes(keyword) || keyword.includes(word))
      );
      
      if (matches.length > 2) {
        return qa.answer;
      }
    }
    
    return null;
  };

  const validateFile = (file: File): string | null => {
    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      return "File size must be less than 2MB";
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return "Only JPEG, PNG, and PDF files are allowed";
    }

    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentConversationId || !user) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid File",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setUploadingFile(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      // Send message with file
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: currentConversationId,
          content: `Shared a file: ${file.name}`,
          is_user_message: true,
          file_url: urlData.publicUrl
        });

      if (messageError) throw messageError;

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload messages
      loadMessages();

      toast({
        title: "File Uploaded",
        description: "Your file has been shared successfully.",
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentConversationId || !user) return;

    setIsLoading(true);
    const userMessage = inputMessage.trim();
    setInputMessage('');

    try {
      // Add user message
      const { error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: currentConversationId,
          content: userMessage,
          is_user_message: true
        });

      if (userMsgError) throw userMsgError;

      // Find AI response with order context if selected
      const selectedOrder = selectedOrderId ? orders.find(order => order.id === selectedOrderId) : undefined;
      const response = findBestAnswer(userMessage, selectedOrder) || 
        "I'm sorry, I couldn't find a specific answer to your question. Would you like me to escalate this to our support team?";

      // Add AI response
      const { error: aiMsgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: currentConversationId,
          content: response,
          is_user_message: false
        });

      if (aiMsgError) throw aiMsgError;

      // Reload messages
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!currentConversationId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at');

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleQuestionClick = async (question: string) => {
    if (!currentConversationId || !user) return;

    setIsLoading(true);

    try {
      // Add user message (the question)
      const { error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: currentConversationId,
          content: question,
          is_user_message: true
        });

      if (userMsgError) throw userMsgError;

      // Find AI response with order context if selected
      const selectedOrder = selectedOrderId ? orders.find(order => order.id === selectedOrderId) : undefined;
      const response = findBestAnswer(question, selectedOrder) || 
        "I'm sorry, I couldn't find a specific answer to your question. Would you like me to escalate this to our support team?";

      // Add AI response
      const { error: aiMsgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: currentConversationId,
          content: response,
          is_user_message: false
        });

      if (aiMsgError) throw aiMsgError;

      // Reload messages
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotSatisfied = () => {
    // Find the user's last message to auto-populate the query
    const userMessages = messages.filter(msg => msg.is_user_message);
    const lastUserMessage = userMessages[userMessages.length - 1];
    setQueryText(lastUserMessage?.content || '');
    setQueryDialogOpen(true);
  };

  const handleSubmitQuery = async () => {
    if (!user || !queryText.trim()) return;

    setSubmittingQuery(true);

    try {
      const { error } = await supabase
        .from('customer_queries')
        .insert({
          user_id: user.id,
          conversation_id: currentConversationId,
          query_text: queryText.trim(),
          admin_response: "Thanks for submitting your questions, support team soon will respond on it",
          response_date: new Date().toISOString(),
          status: 'resolved'
        });

      if (error) throw error;

      toast({
        title: "Query Submitted",
        description: "Your query has been submitted to our support team for review.",
      });

      setQueryDialogOpen(false);
      setQueryText('');
    } catch (error) {
      console.error('Error submitting query:', error);
      toast({
        title: "Error",
        description: "Failed to submit query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingQuery(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    loadMessagesForConversation(conversationId);
  };

  // Helper to load messages for a specific conversation
  const loadMessagesForConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at');
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

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

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Sidebar */}
        <div className="lg:w-80 p-4 border-b lg:border-b-0 lg:border-r border-white/20 space-y-4">
          {/* Order Selection */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Your Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedOrderId || "general"} onValueChange={(value) => setSelectedOrderId(value === "general" ? null : value)}>
                <SelectTrigger className="bg-white/10 border-white/30 text-white">
                  <SelectValue placeholder="Select an order to ask about" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/30">
                  <SelectItem value="general">Ask general questions</SelectItem>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id} className="text-white hover:bg-white/20">
                      <div className="flex flex-col">
                        <span className="font-medium">#{order.order_number}</span>
                        <span className="text-xs text-white/70">{order.scooter_model}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedOrderId && (
                <div className="mt-3 p-3 bg-black/20 rounded border border-white/20">
                  {(() => {
                    const order = orders.find(o => o.id === selectedOrderId);
                    if (!order) return null;
                    return (
                      <div className="space-y-2 text-sm text-white">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span className="font-medium">#{order.order_number}</span>
                        </div>
                        <div className="text-white/80">{order.scooter_model}</div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Truck className="w-3 h-3" />
                          <span className="capitalize">{order.order_status}</span>
                        </div>
                        {order.expected_delivery && (
                          <div className="flex items-center gap-2 text-white/70">
                            <Calendar className="w-3 h-3" />
                            <span>Expected: {new Date(order.expected_delivery).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Predefined Questions */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">Quick Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 lg:h-64">
                <div className="space-y-2">
                  {predefinedQuestions.map((qa) => (
                    <div key={qa.id} className="space-y-1">
                      <Badge variant="outline" className="text-xs text-white/70 border-white/30">
                        {qa.category}
                      </Badge>
                      <Button
                        variant="ghost"
                        className="w-full text-left text-white hover:bg-white/20 h-auto p-3 text-sm font-medium whitespace-normal justify-start"
                        onClick={() => handleQuestionClick(qa.question)}
                      >
                        {qa.question}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="text-center text-white/70 py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation by asking a question or selecting from the quick questions.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_user_message ? 'justify-end' : 'justify-start'}`}
                  >
                     <div
                       className={`max-w-xs lg:max-w-md xl:max-lg px-4 py-2 rounded-lg ${
                         message.is_user_message
                           ? 'bg-white/10 text-white backdrop-blur-sm border border-white/30'
                           : 'bg-white/10 text-white backdrop-blur-sm'
                       }`}
                      >
                       <p className="text-sm">{message.content}</p>
                       
                       {/* File attachment display */}
                       {message.file_url && (
                         <div className="mt-2 p-2 bg-black/20 rounded border border-white/20">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <File className="w-4 h-4" />
                               <span className="text-xs">
                                 {message.content.replace('Shared a file: ', '')}
                               </span>
                             </div>
                             <Button
                               size="sm"
                               variant="ghost"
                               className="h-6 px-2 text-white/70 hover:text-white hover:bg-white/20"
                               onClick={() => handleDownloadFile(
                                 message.file_url!, 
                                 message.content.replace('Shared a file: ', '')
                               )}
                             >
                               <Download className="w-3 h-3" />
                             </Button>
                           </div>
                         </div>
                       )}
                       
                        {!message.is_user_message && (
                          <div className="mt-2 flex gap-2">
                            <AlertDialog open={queryDialogOpen} onOpenChange={setQueryDialogOpen}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-white/70 hover:text-white hover:bg-white/20 h-6 px-2"
                                  onClick={handleNotSatisfied}
                                >
                                  <ThumbsDown className="w-3 h-3 mr-1" />
                                  Not helpful?
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-black/80 border-white/30 backdrop-blur-md text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white text-lg">Submit Query to Support</AlertDialogTitle>
                                  <AlertDialogDescription className="text-white/80">
                                    Please describe your issue or question. Our support team will review it and get back to you.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                  <Textarea
                                    value={queryText}
                                    onChange={(e) => setQueryText(e.target.value)}
                                    placeholder="Describe your issue or question..."
                                    className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-white/50 focus:ring-white/30 min-h-[100px]"
                                  />
                                </div>
                                <AlertDialogFooter className="gap-2">
                                  <AlertDialogCancel className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleSubmitQuery}
                                    disabled={!queryText.trim() || submittingQuery}
                                    className="bg-green-500 text-white hover:bg-green-600 font-medium"
                                  >
                                    {submittingQuery ? 'Submitting...' : 'Submit Query'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          {/* Message Input */}
          <div className="p-4 bg-black/20 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".jpeg,.jpg,.png,.pdf"
                onChange={handleFileUpload}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 border border-white/20"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile || isLoading}
              >
                {uploadingFile ? <Upload className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </Button>
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={selectedOrderId ? "Ask about your selected order..." : "Ask a question about your Ganges scooter..."}
                className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-white/50"
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-white text-electric-dark hover:bg-white/90 font-medium px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;