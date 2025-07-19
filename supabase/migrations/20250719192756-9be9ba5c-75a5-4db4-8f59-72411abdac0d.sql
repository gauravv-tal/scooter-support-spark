-- Allow users to insert their own orders (for demo order generation)
CREATE POLICY "Users can create their own orders" 
ON public.scooter_orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);