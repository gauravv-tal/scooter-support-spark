-- Create KB articles table for product specifications
CREATE TABLE public.kb_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  product_model TEXT,
  specifications JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

-- Create policies - KB articles should be viewable by everyone
CREATE POLICY "Everyone can view active KB articles" 
ON public.kb_articles 
FOR SELECT 
USING (is_active = true);

-- Admins can manage KB articles
CREATE POLICY "Admins can insert KB articles" 
ON public.kb_articles 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'::user_role
));

CREATE POLICY "Admins can update KB articles" 
ON public.kb_articles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'::user_role
));

CREATE POLICY "Admins can delete KB articles" 
ON public.kb_articles 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'::user_role
));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_kb_articles_updated_at
BEFORE UPDATE ON public.kb_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the three Ganges scooter specifications
INSERT INTO public.kb_articles (title, content, category, product_model, specifications) VALUES
(
  'Ganges-X Electric Scooter',
  'Daily city commuters, short-range users. 4 hours battery support with 60-70 km range per charge.',
  'Product Specifications',
  'Ganges-X',
  '{
    "battery_capacity": "2.5 kWh Lithium-ion (removable)",
    "range_idc": "60–70 km per charge",
    "charging_time": "3.5 hours (0–100%)",
    "top_speed": "60 km/h",
    "motor_power": "2.2 kW BLDC hub motor",
    "brakes": "Front disc, rear drum with CBS (Combi-Brake System)",
    "display": "5-inch digital LCD with Bluetooth connectivity",
    "smart_features": "Keyless start, mobile app integration, geo-fencing, anti-theft alarm",
    "suspension": "Telescopic front, dual shock rear",
    "tyres": "12-inch tubeless, alloy wheels",
    "target_users": "Daily city commuters, short-range users",
    "battery_support": "4 hrs"
  }'
),
(
  'Ganges-2X Electric Scooter',
  'Extended city rides, delivery partners, intercity commuters. 8 hours battery support with 120-130 km range per charge.',
  'Product Specifications',
  'Ganges-2X',
  '{
    "battery_capacity": "4.5 kWh Lithium-ion (removable/dual pack)",
    "range_idc": "120–130 km per charge",
    "charging_time": "5 hours (0–100%)",
    "top_speed": "70 km/h",
    "motor_power": "3.5 kW BLDC mid-drive motor",
    "brakes": "Front & rear disc with regenerative braking",
    "display": "7-inch TFT touchscreen, navigation, call/SMS alerts",
    "smart_features": "OTA updates, ride analytics, cruise control, mobile charging port",
    "suspension": "Telescopic front, gas-charged rear",
    "tyres": "12-inch tubeless, alloy wheels, puncture-resistant",
    "target_users": "Extended city rides, delivery partners, intercity commuters",
    "battery_support": "8 hrs"
  }'
),
(
  'Ganges-4X Electric Scooter',
  'Long-range users, fleet operators, intercity travel. 16 hours battery support with 220-240 km range per charge.',
  'Product Specifications',
  'Ganges-4X',
  '{
    "battery_capacity": "8.5 kWh Lithium-ion (modular, swappable)",
    "range_idc": "220–240 km per charge",
    "charging_time": "7 hours (0–100%), fast charging: 2.5 hours (0–80%)",
    "top_speed": "80 km/h",
    "motor_power": "5.5 kW BLDC mid-drive motor with water cooling",
    "brakes": "Dual disc with ABS, regenerative braking",
    "display": "8-inch color TFT, 4G eSIM, live vehicle tracking, remote diagnostics",
    "smart_features": "Adaptive cruise, theft immobilizer, SOS alert, fleet management dashboard",
    "suspension": "Adjustable telescopic front, mono-shock rear",
    "tyres": "13-inch tubeless, alloy wheels, run-flat technology",
    "target_users": "Long-range users, fleet operators, intercity travel",
    "battery_support": "16 hrs"
  }'
);