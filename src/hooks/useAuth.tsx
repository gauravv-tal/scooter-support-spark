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
          // Skip profile creation for mock users (check by specific UUIDs)
          const mockUserIds = ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'];
          if (mockUserIds.includes(session.user.id)) {
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
      // Mock authentication for test numbers with actual database UUIDs
      const mockCredentials = {
        '+918888855555': { 
          otp: '346555', 
          role: 'admin',
          userId: '5a19298f-4737-4335-b7a9-57f36fed3f53',
          displayName: 'Mock Admin User',
          email: 'admin@test.com'
        },
        '+918888844444': { 
          otp: '346444', 
          role: 'customer',
          userId: 'd66413b6-b6c1-413a-9000-abb5520a8f17',
          displayName: 'Mock Customer User',
          email: 'customer@test.com'
        }
      };
      
      if (mockCredentials[phone as keyof typeof mockCredentials]) {
        const mockUser = mockCredentials[phone as keyof typeof mockCredentials];
        if (otp === mockUser.otp) {
          try {
            // First, try to sign in with the real Supabase user we created
            console.log('Attempting to sign in mock user with email:', mockUser.email);
            
            const { data, error } = await supabase.auth.signInWithPassword({
              email: mockUser.email,
              password: 'mockpassword123'
            });
            
            console.log('Sign in result:', { data, error });
            
            if (error) {
              console.error('Failed to sign in mock user:', error);
              toast({
                title: "Authentication Error",
                description: `Mock user sign-in failed: ${error.message}`,
                variant: "destructive",
              });
              return { error };
            }
            
            if (data.user) {
              console.log('Successfully authenticated mock user:', data.user.id);
              
              // Generate demo orders for mock customer
              if (mockUser.role === 'customer') {
                try {
                  const { generateDemoOrders } = await import('@/utils/demoOrders');
                  await generateDemoOrders(data.user.id);
                  console.log('Demo orders generated for mock customer');
                } catch (orderError) {
                  console.error('Error generating demo orders:', orderError);
                }
              }
              
              toast({
                title: "Welcome!",
                description: `Logged in as ${mockUser.role} (authenticated).`,
              });
              return { error: null };
            }
            
          } catch (authError: any) {
            console.error('Authentication error:', authError);
            toast({
              title: "Authentication Error",
              description: "Failed to authenticate mock user.",
              variant: "destructive",
            });
            return { error: authError };
          }
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