import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import gangesLogo from "@/assets/ganges-logo.png";
import dashboardBg from "@/assets/dashboard-bg.jpg";

interface Order {
  id: string;
  order_number: string;
  scooter_model: string;
  order_status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  order_date: string;
  expected_delivery?: string;
  tracking_number?: string;
}

const Orders = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('scooter_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data as Order[] || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'shipped':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'delivered':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${dashboardBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-black/20 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <img src={gangesLogo} alt="Ganges Electric Scooters" className="w-12 h-7 object-contain rounded" />
          <h1 className="text-xl font-bold text-white">My Orders</h1>
        </div>

      {/* Orders List */}
      <div className="p-4 max-w-4xl mx-auto">
        {orders.length === 0 ? (
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-white/50" />
              <h3 className="text-lg font-semibold text-white mb-2">No Orders Found</h3>
              <p className="text-white/70">You haven't placed any orders yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg">
                        Order #{order.order_number}
                      </CardTitle>
                      <CardDescription className="text-white/70">
                        {order.scooter_model}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.order_status)}>
                      {getStatusIcon(order.order_status)}
                      <span className="ml-1 capitalize">{order.order_status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/70">Order Date</p>
                      <p className="text-white">{formatDate(order.order_date)}</p>
                    </div>
                    {order.expected_delivery && (
                      <div>
                        <p className="text-white/70">Expected Delivery</p>
                        <p className="text-white">{formatDate(order.expected_delivery)}</p>
                      </div>
                    )}
                    {order.tracking_number && (
                      <div className="md:col-span-2">
                        <p className="text-white/70">Tracking Number</p>
                        <p className="text-white font-mono">{order.tracking_number}</p>
                      </div>
                    )}
                  </div>
                  
                  {order.order_status === 'shipped' && (
                    <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                      <p className="text-blue-300 text-sm">
                        <Truck className="w-4 h-4 inline mr-2" />
                        Your order is on its way! Use the tracking number above to get real-time updates.
                      </p>
                    </div>
                  )}
                  
                  {order.order_status === 'delivered' && (
                    <div className="mt-4 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                      <p className="text-green-300 text-sm">
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Order delivered! We hope you enjoy your new electric scooter.
                      </p>
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
  );
};

export default Orders;