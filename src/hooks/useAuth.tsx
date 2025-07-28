import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { generateDemoOrders } from '@/utils/demoOrders';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPhone: (phone: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Skip profile creation for mock users
          if (session.user.id.startsWith('mock-')) {
            return;
          }
          
          // Create or update user profile and generate demo orders
          setTimeout(async () => {
            // Check if this is a new user by looking for existing profile
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', session.user.id)
              .single();

            const isNewUser = !existingProfile;

            // Only create profile and generate demo orders for truly new users
            if (isNewUser) {
              const { error } = await supabase
                .from('profiles')
                .insert({
                  user_id: session.user.id,
                  phone_number: session.user.phone,
                  role: session.user.user_metadata?.role || 'customer',
                });
              
              if (error) {
                console.error('Error creating profile:', error);
              }

              // Generate demo orders only for new users
              await generateDemoOrders(session.user.id);
            }
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithPhone = async (phone: string) => {
    try {
      // Mock authentication for test numbers
      const mockNumbers = ['+918888855555', '+918888844444'];
      if (mockNumbers.includes(phone)) {
        toast({
          title: "OTP Sent (Mock)",
          description: "Use OTP 346555 for admin (918888855555) or 346444 for customer (918888844444).",
        });
        return { error: null };
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms'
        }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "OTP Sent",
          description: "Please check your phone for the verification code.",
        });
      }
      
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    try {
      // Mock authentication for test numbers
      const mockCredentials = {
        '+918888855555': { otp: '346555', role: 'admin' },
        '+918888844444': { otp: '346444', role: 'customer' }
      };
      
      console.log('Phone number received:', phone, 'OTP received:', otp);
      console.log('Available mock credentials:', Object.keys(mockCredentials));
      
      if (mockCredentials[phone as keyof typeof mockCredentials]) {
        const mockUser = mockCredentials[phone as keyof typeof mockCredentials];
        if (otp === mockUser.otp) {
          // Create a mock session for testing
          const mockSession = {
            user: {
              id: `mock-${mockUser.role}-${Date.now()}`,
              phone: phone,
              email: `${mockUser.role}@test.com`,
              user_metadata: { role: mockUser.role }
            }
          };
          
          setSession(mockSession as any);
          setUser(mockSession.user as any);
          
          toast({
            title: "Welcome!",
            description: `Logged in as ${mockUser.role} (mock).`,
          });
          
          return { error: null };
        } else {
          toast({
            title: "Verification Failed",
            description: "Invalid OTP. Use 346555 for admin or 346444 for customer.",
            variant: "destructive",
          });
          return { error: { message: "Invalid OTP" } };
        }
      }

      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      });
      
      if (error) {
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome!",
          description: "You have been successfully logged in.",
        });
      }
      
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithPhone,
    verifyOtp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};