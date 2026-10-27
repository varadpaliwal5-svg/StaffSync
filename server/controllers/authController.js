const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'staffsync_secret_jwt_key_2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (or HR/Admin in practice)
const register = async (req, res) => {
  try {
    const { name, email, password, role, employeeId, department, designation, phone, salary } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    let employeeDoc = null;
    // If employee details are provided, create employee record first
    if (employeeId) {
      const existingEmployee = await Employee.findOne({
        $or: [{ employeeId: employeeId.toUpperCase() }, { email: email.toLowerCase() }],
      });
      if (existingEmployee) {
        employeeDoc = existingEmployee;
      } else {
        const names = name.trim().split(' ');
        const firstName = names[0];
        const lastName = names.slice(1).join(' ') || 'User';

        employeeDoc = await Employee.create({
          employeeId: employeeId.toUpperCase(),
          firstName,
          lastName,
          email,
          phone: phone || '123-456-7890',
          department: department || 'Engineering',
          designation: designation || (role === 'manager' ? 'Team Lead' : 'Specialist'),
          salary: salary || 60000,
          status: 'Active',
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      employee: employeeDoc ? employeeDoc._id : null,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee: employeeDoc,
      },
    });
  } catch (err) {
    console.error('[AuthController.register] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email }).populate('employee');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee: user.employee,
      },
    });
  } catch (err) {
    console.error('[AuthController.login] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('employee');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee: user.employee,
      },
    });
  } catch (err) {
    console.error('[AuthController.getMe] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports = { register, login, getMe };
