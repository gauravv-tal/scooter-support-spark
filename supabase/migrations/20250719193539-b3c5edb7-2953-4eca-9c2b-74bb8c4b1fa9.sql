-- Create storage bucket for chat file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', false);

-- Create policies for chat file uploads
CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);