const supabase = require('../config/supabaseClient');
const { createClient } = require('@supabase/supabase-js');
const UserModel = require('../models/User');

// Create a temporary, session-isolated Supabase client for auth operations
// This prevents signInWithPassword/signUp from polluting the shared service-role client
function createAuthClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// @desc    Register user (signup)
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide name, email, and password' });
    }

    // Use a per-request client so signUp doesn't pollute the shared service-role client
    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: 'student', phone: phone || '' },
      },
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    if (phone) {
      try {
        await supabase.from('profiles').update({ phone }).eq('id', data.user.id);
      } catch (e) {
        console.error("Failed to update phone on signup", e);
      }
    }

    // Fetch the full profile created by trigger
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Store user data in session
    req.session.user = profile;
    req.session.token = data.session.access_token;

    res.status(201).json({
      success: true,
      data: {
        user: profile,
        session: data.session,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    // Use a per-request client so signInWithPassword doesn't set session on the shared client
    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Fetch profile (with role) for the frontend using the service-role client (bypasses RLS)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Store user data in session
    req.session.user = profile;
    req.session.token = data.session.access_token;

    res.status(200).json({
      success: true,
      data: {
        user: profile,
        session: data.session,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Destroy server-side session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ success: false, error: 'Could not log out' });
      }
      res.clearCookie('connect.sid'); // default express-session cookie name
      res.status(200).json({ success: true, message: 'Logged out successfully', data: {} });
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update own profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = async (req, res, next) => {
  try {
    const { name, phone, email, password, profile_picture } = req.body;
    let updates = {};

    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (profile_picture !== undefined) updates.profile_picture = profile_picture;

    // 1. Update Auth user (email, password)
    const authUpdates = {};
    if (email) authUpdates.email = email;
    if (password) authUpdates.password = password;

    if (Object.keys(authUpdates).length > 0) {
      const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
        req.user.id,
        authUpdates
      );
      if (authError) {
        return res.status(400).json({ success: false, error: authError.message });
      }
    }

    if (email) updates.email = email; // Keep profile table email consistent

    // 2. Update Profile table
    const profile = await UserModel.updateProfile(req.user.id, updates);

    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin creates a staff account (teacher/admin)
// @route   POST /api/admin/staff
// @access  Private (admin)
exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'name, email, password, and role are required' });
    }
    if (!['teacher', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Role must be teacher or admin' });
    }

    // Use supabase admin (service-role) to create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (authError) {
      return res.status(400).json({ success: false, error: authError.message });
    }

    // The trigger auto-creates a profile, but let's ensure the role is correct
    await UserModel.updateUserRole(authData.user.id, role);
    const profile = await UserModel.getProfileById(authData.user.id);

    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete own profile
// @route   DELETE /api/auth/me
// @access  Private
exports.deleteMe = async (req, res, next) => {
  try {
    // 1. Delete user from auth.users (cascades to profile if triggers setup, but we'll be safe)
    const { error: authError } = await supabase.auth.admin.deleteUser(req.user.id);
    if (authError) {
      return res.status(400).json({ success: false, error: authError.message });
    }

    // 2. Explicitly delete from profile table if it's not cascaded
    await UserModel.deleteProfile(req.user.id);

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
