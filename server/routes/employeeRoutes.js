const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(authorize('hr', 'manager'), getAllEmployees)
  .post(authorize('hr'), createEmployee);

router
  .route('/:id')
  .get(getEmployeeById)
  .put(authorize('hr', 'manager'), updateEmployee)
  .delete(authorize('hr'), deleteEmployee);

module.exports = router;
