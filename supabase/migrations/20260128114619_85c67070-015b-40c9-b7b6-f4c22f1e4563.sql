-- Update the handle_new_user function to use the requested_role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requested_role_text text;
  final_role app_role;
BEGIN
  -- Get the requested role from user metadata (defaults to 'passenger' if not set)
  requested_role_text := COALESCE(NEW.raw_user_meta_data ->> 'requested_role', 'passenger');
  
  -- Validate and cast to app_role enum (only allow valid roles)
  IF requested_role_text IN ('passenger', 'driver') THEN
    final_role := requested_role_text::app_role;
  ELSE
    final_role := 'passenger'::app_role;
  END IF;

  INSERT INTO public.profiles (id, email, phone, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, final_role);
  
  RETURN NEW;
END;
$function$;