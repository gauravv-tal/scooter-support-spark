import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import dashboardBg from "@/assets/dashboard-bg.jpg";

interface Question {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_active: boolean;
}

const AddQuestions = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    answer: "",
    category: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        let role = 'customer';
        
        // For mock users (check by actual database UUIDs), get role from user metadata
        const mockUserIds = ['5a19298f-4737-4335-b7a9-57f36fed3f53', 'd66413b6-b6c1-413a-9000-abb5520a8f17'];
        if (mockUserIds.includes(user.id)) {
          role = user.user_metadata?.role || 'customer';
          console.log('AddQuestions: Mock user detected, role from metadata:', role);
        } else {
          // For real users, get role from database profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();
          
          role = profile?.role || 'customer';
          console.log('AddQuestions: Real user, role from database:', role);
        }
        
        if (role !== "admin") {
          toast({
            title: "Access Denied",
            description: "You need admin privileges to access this page.",
            variant: "destructive"
          });
          navigate("/dashboard");
          return;
        }
        
        setUserRole(role);
        loadQuestions();
      }
    };

    fetchUserRole();
  }, [user, navigate, toast]);

  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from("predefined_questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive"
      });
    } else {
      setQuestions(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // For mock users, don't try to interact with the database
      const mockUserIds = ['5a19298f-4737-4335-b7a9-57f36fed3f53', 'd66413b6-b6c1-413a-9000-abb5520a8f17'];
      if (user && mockUserIds.includes(user.id)) {
        toast({
          title: "Success (Mock)",
          description: "Question would be added successfully (mock user - database operations disabled)"
        });
        setNewQuestion({ question: "", answer: "", category: "" });
        return;
      }

      const { error } = await supabase
        .from("predefined_questions")
        .insert({
          question: newQuestion.question,
          answer: newQuestion.answer,
          category: newQuestion.category || null,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question added successfully"
      });

      setNewQuestion({ question: "", answer: "", category: "" });
      loadQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add question",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("predefined_questions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully"
      });

      loadQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: `url(${dashboardBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div className="relative z-10 text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || userRole !== "admin") {
    return null;
  }

  return (
    <div 
      className="min-h-screen p-4 relative"
      style={{
        backgroundImage: `url(${dashboardBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative z-10">
        <Header />

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          
          {/* Add Question Form */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Add New Question
              </CardTitle>
              <CardDescription className="text-white/70">
                Create predefined questions and answers for customer support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-white">Category (Optional)</Label>
                  <Input
                    id="category"
                    type="text"
                    placeholder="e.g., Battery, Maintenance, Troubleshooting"
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, category: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div>
                  <Label htmlFor="question" className="text-white">Question *</Label>
                  <Input
                    id="question"
                    type="text"
                    placeholder="Enter the question"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="answer" className="text-white">Answer *</Label>
                  <Textarea
                    id="answer"
                    placeholder="Enter the answer"
                    value={newQuestion.answer}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, answer: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-24"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? "Adding..." : "Add Question"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Questions List */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Existing Questions</CardTitle>
              <CardDescription className="text-white/70">
                Manage all predefined questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <p className="text-white/70 text-center py-8">No questions found</p>
                ) : (
                  questions.map((question) => (
                    <div key={question.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          {question.category && (
                            <span className="text-xs bg-blue-600/30 text-blue-200 px-2 py-1 rounded mb-2 inline-block">
                              {question.category}
                            </span>
                          )}
                          <h3 className="text-white font-medium mb-2">{question.question}</h3>
                          <p className="text-white/70 text-sm">{question.answer}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(question.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddQuestions;