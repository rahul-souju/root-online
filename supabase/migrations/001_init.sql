-- Root Online: Initial Database Schema
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE game_rooms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        UNIQUE NOT NULL,           -- 4-letter join code e.g. 'WOLF'
  host_id     UUID        REFERENCES auth.users(id),
  status      TEXT        NOT NULL DEFAULT 'lobby',  -- lobby | playing | finished
  phase       TEXT        NOT NULL DEFAULT 'setup',  -- setup | birdsong | daylight | evening
  state       JSONB       NOT NULL DEFAULT '{}',
  seq         INT         NOT NULL DEFAULT 0,        -- increment on every mutation (optimistic concurrency)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE room_players (
  room_id     UUID  REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id     UUID  REFERENCES auth.users(id),
  faction     TEXT,           -- marquise | eyrie | alliance | vagabond (null until chosen)
  seat_order  INT,
  PRIMARY KEY (room_id, user_id)
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_game_rooms_code   ON game_rooms(code);
CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_room_players_room ON room_players(room_id);
CREATE INDEX idx_room_players_user ON room_players(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE game_rooms   ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

-- game_rooms: players in the room can read; only host can update
CREATE POLICY "Players in room can read game_rooms"
  ON game_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_players
      WHERE room_players.room_id = game_rooms.id
        AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone authenticated can create a game room"
  ON game_rooms FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Host can update game room"
  ON game_rooms FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid() OR EXISTS (
    SELECT 1 FROM room_players
    WHERE room_players.room_id = game_rooms.id
      AND room_players.user_id = auth.uid()
  ));

-- room_players: users can see players in rooms they are in; anyone can insert themselves
CREATE POLICY "Players in room can read room_players"
  ON room_players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_players rp2
      WHERE rp2.room_id = room_players.room_id
        AND rp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can join rooms"
  ON room_players FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Players can update their own row"
  ON room_players FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- Enable Realtime
-- (Also enable in Supabase Dashboard → Database → Replication)
-- ============================================================

-- These statements just ensure the publication exists; run in dashboard if they fail
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
