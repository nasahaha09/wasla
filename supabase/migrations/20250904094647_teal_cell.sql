/*
  # Create users and routes tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `currency` (text, default 'EGP')
      - `credits` (integer, default 10)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `user_routes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `route_name` (text)
      - `from_location` (text)
      - `to_location` (text)
      - `description` (text)
      - `votes` (integer, default 0)
      - `created_at` (timestamp)
    - `route_searches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `from_location` (text)
      - `to_location` (text)
      - `search_type` (text) -- 'chatbot' or 'manual'
      - `credits_used` (integer, default 1)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
    - Add policies for public read access to user routes
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  currency text DEFAULT 'EGP',
  credits integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_routes table
CREATE TABLE IF NOT EXISTS user_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  route_name text NOT NULL,
  from_location text NOT NULL,
  to_location text NOT NULL,
  description text DEFAULT '',
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create route_searches table for tracking usage
CREATE TABLE IF NOT EXISTS route_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  from_location text NOT NULL,
  to_location text NOT NULL,
  search_type text NOT NULL CHECK (search_type IN ('chatbot', 'manual')),
  credits_used integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_searches ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can manage their own routes
CREATE POLICY "Users can read own routes"
  ON user_routes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create routes"
  ON user_routes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routes"
  ON user_routes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routes"
  ON user_routes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Public can read all user routes (for community features)
CREATE POLICY "Public can read all routes"
  ON user_routes
  FOR SELECT
  TO anon
  USING (true);

-- Users can read their own search history
CREATE POLICY "Users can read own searches"
  ON route_searches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create search records"
  ON route_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_routes_user_id ON user_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_route_searches_user_id ON route_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();