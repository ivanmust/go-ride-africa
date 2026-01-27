-- Create storage bucket for driver documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create table for tracking driver documents
CREATE TABLE public.driver_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('drivers_license', 'national_id', 'vehicle_registration', 'insurance', 'inspection_certificate')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_type)
);

-- Enable RLS
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own documents
CREATE POLICY "Users can view their own documents"
ON public.driver_documents
FOR SELECT
USING (auth.uid() = user_id);

-- Drivers can insert their own documents
CREATE POLICY "Users can upload their own documents"
ON public.driver_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Drivers can update their own pending documents
CREATE POLICY "Users can update their own pending documents"
ON public.driver_documents
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Drivers can delete their own pending documents
CREATE POLICY "Users can delete their own pending documents"
ON public.driver_documents
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Add trigger for updated_at
CREATE TRIGGER update_driver_documents_updated_at
BEFORE UPDATE ON public.driver_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for driver documents bucket
CREATE POLICY "Users can upload their own driver documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own driver documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own driver documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own driver documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);