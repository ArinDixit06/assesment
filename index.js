require('dotenv').config({ path: '../.env' }); // Load environment variables from the root .env file
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL || 'https://fblavdrxyokyhvlsnott.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibGF2ZHJxeW9reWh2aXNub3R0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA2NTYyMywiZXhwIjoyMDc2NjQxNjIzfQ.moTPQp-blmK2Hw39VNVZOTTpbDnr6SWgM95BDc5vElI';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Middleware to verify Supabase access token
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error('Supabase auth error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = data.user;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
}

// API Endpoints

// GET /api/profile - Fetch user profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name, age, phone_number, share_data')
      .eq('id', req.user.id)
      .single();

    if (error) {
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/profile - Update user profile
app.put('/api/profile', verifyToken, async (req, res) => {
  try {
    const { name, age, phoneNumber } = req.body;
    const updates = {
      name,
      age: age ? parseInt(age, 10) : null,
      phone_number: phoneNumber,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select();

    if (error) {
      throw error;
    }
    res.json({ message: 'Profile updated successfully', user: data[0] });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/password - Update user password
app.put('/api/password', verifyToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      throw error;
    }
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// GET /api/privacy/share-data - Fetch share_data setting
app.get('/api/privacy/share-data', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('share_data')
      .eq('id', req.user.id)
      .single();

    if (error) {
      throw error;
    }
    res.json({ shareData: data.share_data });
  } catch (error) {
    console.error('Error fetching privacy setting:', error);
    res.status(500).json({ error: 'Failed to fetch privacy setting' });
  }
});

// PUT /api/privacy/share-data - Update share_data setting
app.put('/api/privacy/share-data', verifyToken, async (req, res) => {
  try {
    const { shareData } = req.body;
    const updates = {
      share_data: shareData,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id);

    if (error) {
      throw error;
    }
    res.json({ message: 'Privacy setting updated successfully' });
  } catch (error) {
    console.error('Error updating privacy setting:', error);
    res.status(500).json({ error: 'Failed to update privacy setting' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
