const http = require('http');

// Helper to make HTTP requests
const request = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const waitForServerReady = async (maxAttempts = 30) => {
  process.stdout.write('Waiting for server and database initialization');
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/health',
        method: 'GET',
      });
      if (res.status === 200 && res.data.dbReady) {
        console.log(' -> Ready!\n');
        return true;
      }
    } catch (err) {
      // Server not accepting connections yet
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log(' -> Server timed out waiting for ready state.');
  return false;
};

const runTests = async () => {
  console.log('========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE STAFFSYNC API VERIFICATION SUITE');
  console.log('========================================================\n');

  const ready = await waitForServerReady();
  if (!ready) {
    console.error('Server did not become ready in time.');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      failed++;
    }
  };

  try {
    // 1. Health Check
    console.log('[1/7] Testing API Health Check...');
    const health = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
    });
    assert(health.status === 200 && health.data.status === 'OK', 'Health check returns 200 OK');

    // 2. Authentication: HR, Manager, Employee Logins
    console.log('\n[2/7] Testing Authentication (HR, Manager, Employee)...');
    const hrAuth = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'hr@staffsync.com', password: 'Password123!' }
    );
    assert(hrAuth.status === 200 && hrAuth.data.token && hrAuth.data.user.role === 'hr', 'HR Login returns JWT token and HR role');
    const hrToken = hrAuth.data.token;

    const mgrAuth = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'manager@staffsync.com', password: 'Password123!' }
    );
    assert(mgrAuth.status === 200 && mgrAuth.data.token && mgrAuth.data.user.role === 'manager', 'Manager Login returns JWT and Manager role');
    const mgrToken = mgrAuth.data.token;

    const empAuth = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'employee@staffsync.com', password: 'Password123!' }
    );
    assert(empAuth.status === 200 && empAuth.data.token && empAuth.data.user.role === 'employee', 'Employee Login returns JWT and Employee role');
    const empToken = empAuth.data.token;

    // Test Invalid Login
    const invalidAuth = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'hr@staffsync.com', password: 'WrongPassword' }
    );
    assert(invalidAuth.status === 401, 'Invalid password correctly rejected with 401 Unauthorized');

    // 3. HR Operations: Stats, Employees CRUD
    console.log('\n[3/7] Testing HR Dashboard & Employee CRUD...');
    const statsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/stats/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    assert(statsRes.status === 200 && statsRes.data.data.totalEmployees > 0, 'HR can fetch aggregated dashboard stats');

    const empList = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/employees',
      method: 'GET',
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    assert(empList.status === 200 && empList.data.count >= 7, 'HR can view all employee directory records');

    // Create New Employee
    const newEmpId = `TEST${Math.floor(100 + Math.random() * 900)}`;
    const createEmpRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/employees',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hrToken}`,
        },
      },
      {
        employeeId: newEmpId,
        firstName: 'Jordan',
        lastName: 'Lee',
        email: `jordan.${newEmpId.toLowerCase()}@staffsync.com`,
        phone: '+1 555-0192',
        department: 'Engineering',
        designation: 'QA Automation Engineer',
        salary: 72000,
        createLogin: true,
        password: 'Password123!',
        role: 'employee',
      }
    );
    assert(createEmpRes.status === 201 && createEmpRes.data.data.employeeId === newEmpId, 'HR can create new employee with login account');

    // 4. Role-based Route Guard Verification
    console.log('\n[4/7] Testing Role-Based Route Guard Enforcement...');
    const forbiddenCreateEmp = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/employees',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${empToken}`, // Regular employee trying to create an employee
        },
      },
      {
        employeeId: 'HACK01',
        firstName: 'Bad',
        lastName: 'Actor',
        email: 'bad@staffsync.com',
        phone: '111',
        department: 'Engineering',
        designation: 'Hacker',
        salary: 999999,
      }
    );
    assert(forbiddenCreateEmp.status === 403, 'Regular employee blocked from HR employee creation (403 Forbidden)');

    // 5. Attendance Workflows
    console.log('\n[5/7] Testing Daily Attendance Workflow...');
    const myAtt = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(myAtt.status === 200 && Array.isArray(myAtt.data.data), 'Employee can view their personal attendance history');

    // Check-out (Alex Rivera already checked in today in seed)
    const checkOutRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/attendance/check-out',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${empToken}`,
        },
      },
      { notes: 'Test check-out verification note' }
    );
    assert(
      checkOutRes.status === 200 || (checkOutRes.status === 400 && checkOutRes.data.message.includes('Already checked out')),
      'Employee punch check-out processed properly'
    );

    // 6. Leave Request Application & Manager Approval
    console.log('\n[6/7] Testing Leave Application & Manager Review Workflow...');
    const applyLeaveRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/leaves',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${empToken}`,
        },
      },
      {
        leaveType: 'Casual Leave',
        startDate: '2026-11-10',
        endDate: '2026-11-12',
        reason: 'Verification test for leave request submission.',
      }
    );
    assert(applyLeaveRes.status === 201 && applyLeaveRes.data.data.status === 'Pending', 'Employee can apply for leave (Status: Pending)');
    const createdLeaveId = applyLeaveRes.data.data._id;

    // Manager Approves Leave
    const approveLeaveRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/leaves/${createdLeaveId}/status`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mgrToken}`,
        },
      },
      {
        status: 'Approved',
        reviewComments: 'Approved by engineering manager for project verification.',
      }
    );
    assert(approveLeaveRes.status === 200 && approveLeaveRes.data.data.status === 'Approved', 'Manager can review and approve leave request');

    // 7. Training Programs & Announcements
    console.log('\n[7/7] Testing Training Programs & Announcements Management...');
    const createTrainingRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/training',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mgrToken}`,
        },
      },
      {
        title: 'Cloud Native Microservices & Docker Verification',
        description: 'Comprehensive test workshop on containerization.',
        trainer: 'Alexandre Dumas',
        department: 'Engineering',
        startDate: '2026-11-01',
        endDate: '2026-11-05',
        status: 'Upcoming',
      }
    );
    assert(createTrainingRes.status === 201 && createTrainingRes.data.data.title.includes('Cloud Native'), 'Manager can create training program');

    const createAnnounceRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/announcements',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mgrToken}`,
        },
      },
      {
        title: 'System Release v1.0 Live',
        content: 'StaffSync v1.0 has completed integration testing.',
        category: 'Company News',
        targetAudience: 'All',
      }
    );
    assert(createAnnounceRes.status === 201, 'Manager/HR can broadcast announcement');

    console.log('\n========================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
};

runTests();
