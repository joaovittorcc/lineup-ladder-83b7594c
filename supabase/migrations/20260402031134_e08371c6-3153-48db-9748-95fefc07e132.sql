
-- Drop the overly permissive INSERT policy
DROP POLICY "Authenticated users can create challenges" ON public.challenges;

-- Create a proper INSERT policy
CREATE POLICY "Pilots and jokers can create challenges"
  ON public.challenges FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'pilot')
    OR public.has_role(auth.uid(), 'joker')
  );
