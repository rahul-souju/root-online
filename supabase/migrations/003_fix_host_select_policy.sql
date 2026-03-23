-- Fix: host can't read back game_rooms immediately after INSERT
-- PostgREST runs the SELECT policy on the RETURNING clause of INSERT...SELECT.
-- is_room_member() returns false at that point because the host hasn't been
-- added to room_players yet — so the row was silently blocked.
-- Solution: also allow host_id = auth.uid() on the SELECT policy.

DROP POLICY IF EXISTS "Players in room can read game_rooms" ON game_rooms;

CREATE POLICY "Players in room can read game_rooms"
  ON game_rooms FOR SELECT
  TO authenticated
  USING (
    host_id = auth.uid()           -- host can always read their own room
    OR public.is_room_member(id)   -- joined players can read too
  );
