-- Fix: infinite recursion in room_players RLS SELECT policy
-- The original policy queried room_players from within room_players' own
-- SELECT policy → Postgres detected infinite recursion and aborted every
-- INSERT/SELECT that touched either table.
--
-- Solution: replace the self-referential policy with a SECURITY DEFINER
-- function. Because it runs as its owner (postgres) it reads room_players
-- without triggering the SELECT policy again, breaking the cycle.

DROP POLICY IF EXISTS "Players in room can read room_players" ON room_players;
DROP POLICY IF EXISTS "Players in room can read game_rooms"   ON game_rooms;

-- Non-recursive membership helper
CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_players
    WHERE room_id = p_room_id
      AND user_id = auth.uid()
  );
$$;

-- Recreate policies using the helper (no more recursion)
CREATE POLICY "Players in room can read room_players"
  ON room_players FOR SELECT
  TO authenticated
  USING (public.is_room_member(room_id));

CREATE POLICY "Players in room can read game_rooms"
  ON game_rooms FOR SELECT
  TO authenticated
  USING (public.is_room_member(id));
