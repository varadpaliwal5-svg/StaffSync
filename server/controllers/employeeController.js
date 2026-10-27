const Employee = require('../models/Employee');
const User = require('../models/User');

// @desc    Get all employees with optional filtering & search
// @route   GET /api/employees
// @access  Private (HR, Manager)
const getAllEmployees = async (req, res) => {
  try {
    const { department, status, search } = req.query;
    const query = {};

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (err) {
    console.error('[EmployeeController.getAllEmployees] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    return res.status(200).json({ success: true, data: employee });
  } catch (err) {
    console.error('[EmployeeController.getEmployeeById] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Create new employee record (and optional login user)
// @route   POST /api/employees
// @access  Private (HR only)
const createEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      salary,
      dateOfJoining,
      status,
      createLogin,
      password,
      role,
    } = req.body;

    // Check duplicate employee ID or email
    const existing = await Employee.findOne({
      $or: [{ employeeId: employeeId.toUpperCase() }, { email: email.toLowerCase() }],
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this Employee ID or Email already exists',
      });
    }

    const employee = await Employee.create({
      employeeId: employeeId.toUpperCase(),
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      department,
      designation,
      salary,
      dateOfJoining: dateOfJoining || new Date(),
      status: status || 'Active',
    });

    // If createLogin is requested or default password provided, create User account
    if (createLogin) {
      const userPassword = password || 'Password123!';
      const userRole = role || (department === 'Human Resources' ? 'hr' : 'employee');
      await User.create({
        name: `${firstName} ${lastName}`,
        email: email.toLowerCase(),
        password: userPassword,
        role: userRole,
        employee: employee._id,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee,
    });
  } catch (err) {
    console.error('[EmployeeController.createEmployee] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Update employee record
// @route   PUT /api/employees/:id
// @access  Private (HR, or Manager for certain fields)
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('[EmployeeController.updateEmployee] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// @desc    Delete employee record
// @route   DELETE /api/employees/:id
// @access  Private (HR only)
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Also remove associated User account if any
    await User.deleteMany({
      $or: [{ employee: employee._id }, { email: employee.email }],
    });

    await Employee.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Employee and linked account removed successfully',
    });
  } catch (err) {
    console.error('[EmployeeController.deleteEmployee] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
