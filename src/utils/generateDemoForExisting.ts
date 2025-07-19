import { supabase } from "@/integrations/supabase/client";
import { generateDemoOrders } from "./demoOrders";

// One-time function to generate demo orders for existing users
export async function generateDemoOrdersForExistingUser() {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    // Check if user already has orders
    const { data: existingOrders } = await supabase
      .from('scooter_orders')
      .select('id')
      .eq('user_id', user.id);

    if (existingOrders && existingOrders.length > 0) {
      console.log('User already has orders');
      return;
    }

    // Generate demo orders
    await generateDemoOrders(user.id);
    console.log('Demo orders generated for existing user');
    
    // Refresh the page to show new orders
    window.location.reload();
  } catch (error) {
    console.error('Error generating demo orders for existing user:', error);
  }
}