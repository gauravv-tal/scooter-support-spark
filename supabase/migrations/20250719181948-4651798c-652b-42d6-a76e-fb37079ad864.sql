-- Add admin response capability to customer_queries table
ALTER TABLE public.customer_queries 
ADD COLUMN admin_response TEXT,
ADD COLUMN response_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN responded_by UUID;

-- Add trigger for updated_at
CREATE TRIGGER update_customer_queries_updated_at
BEFORE UPDATE ON public.customer_queries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();