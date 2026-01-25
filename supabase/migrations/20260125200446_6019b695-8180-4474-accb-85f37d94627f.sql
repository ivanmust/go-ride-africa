-- Create ride_messages table for in-app chat between driver and passenger
CREATE TABLE public.ride_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('passenger', 'driver')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for ride messages
CREATE POLICY "Users can view messages for their rides"
ON public.ride_messages
FOR SELECT
USING (
  sender_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.ride_history 
    WHERE ride_history.id = ride_messages.ride_id 
    AND ride_history.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages"
ON public.ride_messages
FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own messages read status"
ON public.ride_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ride_history 
    WHERE ride_history.id = ride_messages.ride_id 
    AND ride_history.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_ride_messages_ride_id ON public.ride_messages(ride_id);
CREATE INDEX idx_ride_messages_created_at ON public.ride_messages(created_at);

-- Enable realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;