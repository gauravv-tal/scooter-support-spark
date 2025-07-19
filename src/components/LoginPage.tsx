import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Zap } from "lucide-react";
import gangesLogo from "@/assets/ganges-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithPhone, verifyOtp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await signInWithPhone(phoneNumber);
      if (!error) {
        setShowOtp(true);
      }
    } catch (error) {
      console.error("Failed to send OTP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await verifyOtp(phoneNumber, otp);
      if (!error) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Failed to verify OTP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5 flex items-center justify-center p-4">
      {/* Background Electric Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-primary-glow/15 rounded-full blur-2xl animate-pulse delay-700"></div>
      </div>

      <Card className="w-full max-w-md mx-auto bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <img src={gangesLogo} alt="Ganges Electric Scooters" className="w-32 h-18 mx-auto mb-4 rounded-lg" />
          <h1 className="text-3xl font-bold text-white mb-2">Ganges Support</h1>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              Welcome to Ganges
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your electric scooter support portal
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showOtp ? (
            /* Phone Number Input */
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Mobile Number
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary/60 focus:ring-primary/20"
                    maxLength={15}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSendOtp}
                disabled={!phoneNumber || phoneNumber.length < 10 || isLoading}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground font-semibold shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    <span>Sending OTP...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Send OTP</span>
                  </div>
                )}
              </Button>
            </div>
          ) : (
            /* OTP Input */
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Enter Verification Code
                </h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a 6-digit code to {phoneNumber}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-foreground">
                  OTP Code
                </label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="text-center text-2xl font-mono tracking-[0.5em] h-14 bg-background/50 border-border/60 focus:border-primary/60 focus:ring-primary/20"
                  maxLength={6}
                />
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleVerifyOtp}
                  disabled={!otp || otp.length !== 6 || isLoading}
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground font-semibold shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={() => setShowOtp(false)}
                  className="w-full text-primary hover:text-primary/80 hover:bg-primary/5"
                >
                  Change Number
                </Button>
              </div>
            </div>
          )}

          {/* Support Info */}
          <div className="pt-4 border-t border-border/30">
            <p className="text-xs text-center text-muted-foreground">
              Need help? Contact our support team
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;