-- Create a function to switch user roles securely
CREATE OR REPLACE FUNCTION public.switch_user_role(_new_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow switching between passenger and driver (not admin)
  IF _new_role NOT IN ('passenger', 'driver') THEN
    RAISE EXCEPTION 'Invalid role. Can only switch between passenger and driver.';
  END IF;
  
  -- Update the user's role
  UPDATE public.user_roles
  SET role = _new_role
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User role not found';
  END IF;
END;
$function$;