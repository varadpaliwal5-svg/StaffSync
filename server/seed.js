const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Employee = require('./models/Employee');
const LeaveRequest = require('./models/LeaveRequest');
const Attendance = require('./models/Attendance');
const Announcement = require('./models/Announcement');
const TrainingProgram = require('./models/TrainingProgram');

dotenv.config();

// Helper date strings
const getFormattedDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const seedDatabase = async () => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 0) {
      console.log('[Seeder] Connecting to database to seed initial data...');
      await connectDB();
    }

    // Clear existing collections
    console.log('[Seeder] Clearing old records...');
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Attendance.deleteMany({}),
      Announcement.deleteMany({}),
      TrainingProgram.deleteMany({}),
    ]);

    console.log('[Seeder] Creating employees...');
    // 1. Employees
    const employeesData = [
      {
        employeeId: 'HR001',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        email: 'hr@staffsync.com',
        phone: '+1 (555) 234-5678',
        department: 'Human Resources',
        designation: 'Senior HR Director',
        salary: 95000,
        dateOfJoining: new Date('2022-01-15'),
        status: 'Active',
      },
      {
        employeeId: 'MGR101',
        firstName: 'Michael',
        lastName: 'Chang',
        email: 'manager@staffsync.com',
        phone: '+1 (555) 345-6789',
        department: 'Engineering',
        designation: 'Engineering Lead',
        salary: 110000,
        dateOfJoining: new Date('2021-06-01'),
        status: 'Active',
      },
      {
        employeeId: 'MGR102',
        firstName: 'Elena',
        lastName: 'Rostova',
        email: 'manager2@staffsync.com',
        phone: '+1 (555) 456-7890',
        department: 'Marketing',
        designation: 'Marketing Director',
        salary: 105000,
        dateOfJoining: new Date('2022-03-10'),
        status: 'Active',
      },
      {
        employeeId: 'EMP201',
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'employee@staffsync.com',
        phone: '+1 (555) 567-8901',
        department: 'Engineering',
        designation: 'Senior Full Stack Engineer',
        salary: 85000,
        dateOfJoining: new Date('2023-02-20'),
        status: 'Active',
      },
      {
        employeeId: 'EMP202',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.sharma@staffsync.com',
        phone: '+1 (555) 678-9012',
        department: 'Engineering',
        designation: 'Cloud Systems Developer',
        salary: 82000,
        dateOfJoining: new Date('2023-05-12'),
        status: 'Active',
      },
      {
        employeeId: 'EMP203',
        firstName: 'David',
        lastName: 'Kim',
        email: 'david.kim@staffsync.com',
        phone: '+1 (555) 789-0123',
        department: 'Marketing',
        designation: 'Growth & Content Specialist',
        salary: 68000,
        dateOfJoining: new Date('2023-08-01'),
        status: 'Active',
      },
      {
        employeeId: 'EMP204',
        firstName: 'Ananya',
        lastName: 'Patel',
        email: 'ananya.patel@staffsync.com',
        phone: '+1 (555) 890-1234',
        department: 'Finance',
        designation: 'Financial Operations Analyst',
        salary: 74000,
        dateOfJoining: new Date('2023-09-15'),
        status: 'Active',
      },
    ];

    const createdEmployees = await Employee.insertMany(employeesData);
    const empMap = {};
    createdEmployees.forEach((e) => {
      empMap[e.email] = e;
    });

    console.log('[Seeder] Creating user accounts with secure password hashing...');
    // 2. Users (Passwords: Password123!)
    const usersData = [
      {
        name: 'Sarah Jenkins',
        email: 'hr@staffsync.com',
        password: 'Password123!',
        role: 'hr',
        employee: empMap['hr@staffsync.com']._id,
      },
      {
        name: 'Michael Chang',
        email: 'manager@staffsync.com',
        password: 'Password123!',
        role: 'manager',
        employee: empMap['manager@staffsync.com']._id,
      },
      {
        name: 'Elena Rostova',
        email: 'manager2@staffsync.com',
        password: 'Password123!',
        role: 'manager',
        employee: empMap['manager2@staffsync.com']._id,
      },
      {
        name: 'Alex Rivera',
        email: 'employee@staffsync.com',
        password: 'Password123!',
        role: 'employee',
        employee: empMap['employee@staffsync.com']._id,
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@staffsync.com',
        password: 'Password123!',
        role: 'employee',
        employee: empMap['priya.sharma@staffsync.com']._id,
      },
      {
        name: 'David Kim',
        email: 'david.kim@staffsync.com',
        password: 'Password123!',
        role: 'employee',
        employee: empMap['david.kim@staffsync.com']._id,
      },
      {
        name: 'Ananya Patel',
        email: 'ananya.patel@staffsync.com',
        password: 'Password123!',
        role: 'employee',
        employee: empMap['ananya.patel@staffsync.com']._id,
      },
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const created = await User.create(u);
      createdUsers.push(created);
    }
    const userMap = {};
    createdUsers.forEach((u) => {
      userMap[u.email] = u;
    });

    console.log('[Seeder] Creating attendance records...');
    // 3. Attendance Records (Past 3 days + Today)
    const today = getFormattedDate(0);
    const yesterday = getFormattedDate(-1);
    const dayBeforeYesterday = getFormattedDate(-2);

    const attendanceData = [
      // Today
      {
        employee: empMap['employee@staffsync.com']._id,
        date: today,
        checkIn: '09:02 AM',
        checkOut: '',
        status: 'Present',
        notes: 'Working on frontend dashboard components',
      },
      {
        employee: empMap['priya.sharma@staffsync.com']._id,
        date: today,
        checkIn: '08:55 AM',
        checkOut: '',
        status: 'Present',
        notes: 'Reviewing API endpoints',
      },
      {
        employee: empMap['david.kim@staffsync.com']._id,
        date: today,
        checkIn: '09:30 AM',
        checkOut: '',
        status: 'Work From Home',
        notes: 'Approved remote workday',
      },
      {
        employee: empMap['ananya.patel@staffsync.com']._id,
        date: today,
        checkIn: '09:10 AM',
        checkOut: '',
        status: 'Present',
        notes: 'Financial quarter closing audit',
      },
      // Yesterday
      {
        employee: empMap['employee@staffsync.com']._id,
        date: yesterday,
        checkIn: '09:00 AM',
        checkOut: '05:35 PM',
        status: 'Present',
        notes: 'Full day completed',
      },
      {
        employee: empMap['priya.sharma@staffsync.com']._id,
        date: yesterday,
        checkIn: '09:12 AM',
        checkOut: '05:30 PM',
        status: 'Present',
        notes: 'Sprint planning and development',
      },
      {
        employee: empMap['david.kim@staffsync.com']._id,
        date: yesterday,
        checkIn: '09:15 AM',
        checkOut: '01:30 PM',
        status: 'Half-day',
        notes: 'Personal doctor appointment afternoon',
      },
      // Day before yesterday
      {
        employee: empMap['employee@staffsync.com']._id,
        date: dayBeforeYesterday,
        checkIn: '08:58 AM',
        checkOut: '05:40 PM',
        status: 'Present',
        notes: '',
      },
    ];

    await Attendance.insertMany(attendanceData);

    console.log('[Seeder] Creating leave requests...');
    // 4. Leave Requests
    const leaveData = [
      {
        employee: empMap['employee@staffsync.com']._id,
        leaveType: 'Casual Leave',
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        reason: 'Attending family wedding ceremony out of state.',
        status: 'Pending',
      },
      {
        employee: empMap['priya.sharma@staffsync.com']._id,
        leaveType: 'Paid Leave',
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        reason: 'Annual personal rejuvenation vacation.',
        status: 'Approved',
        reviewedBy: userMap['manager@staffsync.com']._id,
        reviewComments: 'Approved! Please ensure handover to Alex before departure.',
      },
      {
        employee: empMap['david.kim@staffsync.com']._id,
        leaveType: 'Sick Leave',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        reason: 'High fever and viral infection recovery.',
        status: 'Approved',
        reviewedBy: userMap['hr@staffsync.com']._id,
        reviewComments: 'Medical certificate received and verified.',
      },
      {
        employee: empMap['ananya.patel@staffsync.com']._id,
        leaveType: 'Casual Leave',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        reason: 'Personal errands in hometown.',
        status: 'Pending',
      },
    ];

    await LeaveRequest.insertMany(leaveData);

    console.log('[Seeder] Creating company announcements...');
    // 5. Announcements
    const announcementData = [
      {
        title: '🎉 Welcome to StaffSync HRM Platform 2026',
        content:
          'We are delighted to inaugurate our upgraded human resource management portal. Employees can now easily submit leave applications, view daily logs, track announcements, and enroll in company growth programs.',
        category: 'Company News',
        targetAudience: 'All',
        postedBy: userMap['hr@staffsync.com']._id,
        postedByName: 'Sarah Jenkins (HR Director)',
      },
      {
        title: '🌴 Upcoming Public Holiday: Organization Schedule',
        content:
          'Please note that our offices will remain closed upcoming Monday on account of the public holiday. Urgent customer escalations will be monitored by the on-call support team.',
        category: 'Holiday',
        targetAudience: 'All',
        postedBy: userMap['hr@staffsync.com']._id,
        postedByName: 'Sarah Jenkins (HR Director)',
      },
      {
        title: '💡 Engineering All-Hands: Q4 Architectural Roadmap',
        content:
          'Engineering team members are requested to attend the quarterly sprint review on Thursday at 3:00 PM. We will review microservices decoupling and cloud cost optimizations.',
        category: 'General',
        targetAudience: 'All',
        postedBy: userMap['manager@staffsync.com']._id,
        postedByName: 'Michael Chang (Engineering Lead)',
      },
    ];

    await Announcement.insertMany(announcementData);

    console.log('[Seeder] Creating training programs...');
    // 6. Training Programs
    const trainingData = [
      {
        title: 'Full Stack MERN Architecture & Scalability',
        description:
          'Deep dive into modern React best practices, Express MVC patterns, JWT security, and MongoDB schema design for high performance.',
        trainer: 'Dr. Robert Vance, Principal Software Architect',
        department: 'Engineering',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'Ongoing',
        participants: [
          {
            employee: empMap['employee@staffsync.com']._id,
            enrolledAt: new Date(),
            progress: 65,
            completionStatus: 'In Progress',
          },
          {
            employee: empMap['priya.sharma@staffsync.com']._id,
            enrolledAt: new Date(),
            progress: 80,
            completionStatus: 'In Progress',
          },
        ],
        createdBy: userMap['manager@staffsync.com']._id,
      },
      {
        title: 'Agile Leadership & Cross-Functional Team Synergy',
        description:
          'Mastering stakeholder alignment, sprint retrospective techniques, and fostering healthy peer collaboration across departments.',
        trainer: 'Laura Croft, Certified Scrum Coach',
        department: 'All Departments',
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        status: 'Upcoming',
        participants: [
          {
            employee: empMap['david.kim@staffsync.com']._id,
            enrolledAt: new Date(),
            progress: 0,
            completionStatus: 'Enrolled',
          },
        ],
        createdBy: userMap['hr@staffsync.com']._id,
      },
      {
        title: 'Enterprise Cyber Security & Data Privacy Compliance',
        description:
          'Comprehensive training on zero-trust security policies, password standards, phishing defense, and GDPR data handling.',
        trainer: 'Ethan Hunt, Cyber Risk Auditor',
        department: 'All Departments',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: 'Completed',
        participants: [
          {
            employee: empMap['employee@staffsync.com']._id,
            enrolledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            progress: 100,
            completionStatus: 'Completed',
          },
          {
            employee: empMap['ananya.patel@staffsync.com']._id,
            enrolledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            progress: 100,
            completionStatus: 'Completed',
          },
        ],
        createdBy: userMap['hr@staffsync.com']._id,
      },
    ];

    await TrainingProgram.insertMany(trainingData);

    console.log('====================================================');
    console.log('✅ STAFFSYNC DEMO DATABASE SEEDED SUCCESSFULLY!');
    console.log('====================================================');
    console.log('Demo Accounts:');
    console.log('  HR Admin:  hr@staffsync.com       / Password123!');
    console.log('  Manager:   manager@staffsync.com  / Password123!');
    console.log('  Employee:  employee@staffsync.com / Password123!');
    console.log('====================================================');

    return true;
  } catch (err) {
    console.error('[Seeder] Error during seeding:', err);
    throw err;
  }
};

// If run directly via node seed.js
if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      await disconnectDB();
      process.exit(1);
    });
}

module.exports = seedDatabase;
