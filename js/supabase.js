// Supabase client configuration
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database operations for users
export async function createUser(userData) {
  try {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) throw authError;

    // Then create user profile
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          currency: userData.currency || 'EGP',
          credits: 10
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating user:', error);
    return { data: null, error };
  }
}

export async function signInUser(email, password) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) throw userError;

    return { data: { auth: authData, user: userData }, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { data: null, error };
  }
}

export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
}

export async function getCurrentUser() {
  try {
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData.user) {
      return { data: null, error: null };
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (error) throw error;
    return { data: userData, error: null };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { data: null, error };
  }
}

export async function updateUserCredits(userId, newCredits) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating credits:', error);
    return { data: null, error };
  }
}

// Database operations for user routes
export async function createUserRoute(routeData) {
  try {
    const { data, error } = await supabase
      .from('user_routes')
      .insert([routeData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating route:', error);
    return { data: null, error };
  }
}

export async function getUserRoutes(userId) {
  try {
    const { data, error } = await supabase
      .from('user_routes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user routes:', error);
    return { data: null, error };
  }
}

export async function getAllUserRoutes() {
  try {
    const { data, error } = await supabase
      .from('user_routes')
      .select(`
        *,
        users (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all routes:', error);
    return { data: null, error };
  }
}

export async function voteOnRoute(routeId, increment = true) {
  try {
    const { data: currentRoute, error: fetchError } = await supabase
      .from('user_routes')
      .select('votes')
      .eq('id', routeId)
      .single();

    if (fetchError) throw fetchError;

    const newVotes = increment ? currentRoute.votes + 1 : Math.max(0, currentRoute.votes - 1);

    const { data, error } = await supabase
      .from('user_routes')
      .update({ votes: newVotes })
      .eq('id', routeId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error voting on route:', error);
    return { data: null, error };
  }
}

// Database operations for route searches
export async function recordRouteSearch(searchData) {
  try {
    const { data, error } = await supabase
      .from('route_searches')
      .insert([searchData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error recording search:', error);
    return { data: null, error };
  }
}

export async function getUserSearchHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('route_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching search history:', error);
    return { data: null, error };
  }
}
