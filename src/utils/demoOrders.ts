import { supabase } from "@/integrations/supabase/client";

const GANGES_MODELS = ['Ganges-X', 'Ganges-2X', 'Ganges-4X'] as const;
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];
const ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'confirmed'];

function getDeliveryDate(model: string, orderDate: Date): Date {
  const deliveryDate = new Date(orderDate);
  
  switch (model) {
    case 'Ganges-X':
      deliveryDate.setDate(deliveryDate.getDate() + 7); // 1 week
      break;
    case 'Ganges-2X':
      deliveryDate.setMonth(deliveryDate.getMonth() + 1); // 1 month
      break;
    case 'Ganges-4X':
      deliveryDate.setMonth(deliveryDate.getMonth() + 2); // 2 months
      break;
    default:
      deliveryDate.setDate(deliveryDate.getDate() + 7);
  }
  
  return deliveryDate;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `GNG${timestamp}${random}`;
}

function generateTrackingNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TRK';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateDemoOrders(userId: string): Promise<void> {
  try {
    const orders = [];
    const orderCount = Math.floor(Math.random() * 3) + 3; // 3-5 orders
    
    // Create array of models: first 3 are distinct, rest are random
    const modelsToAssign = [...GANGES_MODELS];
    for (let i = 3; i < orderCount; i++) {
      modelsToAssign.push(GANGES_MODELS[Math.floor(Math.random() * GANGES_MODELS.length)]);
    }
    
    // Shuffle the array to randomize order
    for (let i = modelsToAssign.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [modelsToAssign[i], modelsToAssign[j]] = [modelsToAssign[j], modelsToAssign[i]];
    }
    
    for (let i = 0; i < orderCount; i++) {
      const orderDate = new Date();
      // Randomize order dates within last 3 months
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 90));
      
      const model = modelsToAssign[i];
      const expectedDelivery = getDeliveryDate(model, orderDate);
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const status = ORDER_STATUSES[Math.floor(Math.random() * ORDER_STATUSES.length)];
      
      orders.push({
        user_id: userId,
        order_number: generateOrderNumber(),
        scooter_model: model,
        order_status: status,
        order_date: orderDate.toISOString(),
        expected_delivery: expectedDelivery.toISOString(),
        tracking_number: generateTrackingNumber(),
        created_at: orderDate.toISOString(),
        updated_at: orderDate.toISOString()
      });
    }
    
    const { error } = await supabase
      .from('scooter_orders')
      .insert(orders);
    
    if (error) {
      console.error('Error creating demo orders:', error);
    } else {
      console.log(`Created ${orderCount} demo orders for user ${userId}`);
    }
  } catch (error) {
    console.error('Error in generateDemoOrders:', error);
  }
}