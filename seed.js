const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import all models
const Domain = require('./models/Domain');
const Guide = require('./models/Guide');
const Student = require('./models/Student');
const Admin = require('./models/Admin');
const Login = require('./models/Login');
const Team = require('./models/Team');
const Proposal = require('./models/Proposal');
const Sprint = require('./models/Sprint');
const Task = require('./models/Task');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sprint-sync';

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected...');

        // WIPE DATA (but keep the admin)
        console.log('Wiping non-admin data...');
        const adminLogin = await Login.findOne({ role: 'admin' });
        
        await Promise.all([
            Domain.deleteMany({}), Guide.deleteMany({}), Student.deleteMany({}),
            Team.deleteMany({}), Proposal.deleteMany({}), Sprint.deleteMany({}), 
            Task.deleteMany({})
        ]);

        if (adminLogin) {
            await Login.deleteMany({ _id: { $ne: adminLogin._id } });
        } else {
            await Login.deleteMany({});
        }

        // CREATE ADMIN (if it doesn't exist)
        console.log('Ensuring admin user exists...');
        const hashedPassword = await bcrypt.hash('password123', 12);
        const adminProfile = await Admin.findOneAndUpdate({ name: 'Admin User' }, { name: 'Admin User' }, { upsert: true, new: true });
        await Login.findOneAndUpdate(
            { email: 'admin@test.com' },
            { email: 'admin@test.com', password: hashedPassword, role: 'admin', profileId: adminProfile._id, roleRef: 'Admin', status: 'approved' },
            { upsert: true, new: true }
        );

        // CREATE DOMAINS
        console.log('Creating domains...');
        const domains = await Domain.insertMany([ { name: 'Web App' }, { name: 'Mobile App' }, { name: 'AI/ML' } ]);

        // CREATE GUIDES (Reviewers)
        console.log('Creating guides (reviewers)...');
        const reviewerData = [
            { name: 'Dr Sandhya R', department: 'MCA' }, { name: 'Prof Rubitha Chand', department: 'MCA' },
            { name: 'Dr Alby S', department: 'MCA' }, { name: 'Prof Rohini Raju', department: 'MCA' },
            { name: 'Dr Anoopkumar M', department: 'MCA' }
        ];
        const createdGuides = {};
        for (const data of reviewerData) {
            const guide = await new Guide(data).save();
            createdGuides[data.name] = guide;
            await new Login({
                email: `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@guide.com`,
                password: hashedPassword, role: 'guide', profileId: guide._id, roleRef: 'Guide', status: 'approved'
            }).save();
        }

        // CREATE STUDENTS
        console.log('Creating students...');
        const studentData = {
            'Group A1': ['SHARON GJO YOHANNAN', 'HARIKRISHNAN', 'ABHISHEK P'],
            'Group B1': ['ANOOP K R', 'ABLE SHAJI', 'SREERAM R'],
            'Group A2': ['JISHNU B', 'MUHAMMAD SHABEER T P', 'ASHI QUE R'],
            'Group B2': ['ANANDHU KRISHNA S', 'SHIBLY T P'],
            'Individual A1': ['AMAL KRISHNAN V P']
        };

        const createdStudents = {};
        let studentCounter = 1;
        for (const group in studentData) {
            for (const sName of studentData[group]) {
                if (!createdStudents[sName]) {
                    const studentId = `S${String(studentCounter++).padStart(3, '0')}`;
                    const student = await new Student({ name: sName, studentIdNumber: studentId }).save();
                    createdStudents[sName] = student;
                    await new Login({
                        email: `${sName.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.com`,
                        password: hashedPassword, role: 'student', profileId: student._id, roleRef: 'Student', status: 'approved'
                    }).save();
                }
            }
        }

        // --- CREATE TEAMS (ALL TEAMS FROM DOCUMENT) ---
        console.log('Creating teams...');
        const teamsToCreate = [
            { name: 'Group A1', guide: createdGuides['Dr Sandhya R']._id, students: studentData['Group A1'] },
            { name: 'Group B1', guide: createdGuides['Dr Sandhya R']._id, students: studentData['Group B1'] },
            { name: 'Group A2', guide: createdGuides['Dr Alby S']._id, students: studentData['Group A2'] },
            { name: 'Group B2', guide: createdGuides['Dr Alby S']._id, students: studentData['Group B2'] },
            { name: 'Individual A1', guide: createdGuides['Dr Anoopkumar M']._id, students: studentData['Individual A1'] }
        ];

        const createdTeams = {};
        for (const tData of teamsToCreate) {
            const studentIds = tData.students.map(name => createdStudents[name]._id);
            const team = await new Team({ name: tData.name, guide: tData.guide, students: studentIds }).save();
            createdTeams[tData.name] = team;
            
            // --- ADD A DESCRIPTION HERE ---
            await new Proposal({ 
                title: `${tData.name} Project Proposal`, 
                description: `A project proposal for ${tData.name}.`, // <-- Add this line
                team: team._id, 
                domain: domains[0]._id, 
                status: 'Approved' 
            }).save();
        }

        // --- CREATE A SAMPLE ACTIVE SPRINT FOR TEAM "Group A2" ---
        console.log('Creating sample active sprint for Group A2...');
        const teamA2 = createdTeams['Group A2'];
        if (teamA2) {
            const activeSprint = await new Sprint({
                name: 'Sprint 1: Core Functionality',
                goal: 'Develop and test the main features of the application.',
                team: teamA2._id,
                startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
                endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
                capacity: 20,
                status: 'Active'
            }).save();

            await Task.insertMany([
                { description: 'Implement user authentication', storyPoints: 5, team: teamA2._id, sprint: activeSprint._id, assignedTo: createdStudents['JISHNU B']._id, status: 'Done' },
                { description: 'Design database schema', storyPoints: 3, team: teamA2._id, sprint: activeSprint._id, assignedTo: createdStudents['MUHAMMAD SHABEER T P']._id, status: 'In Progress' },
                { description: 'Create dashboard UI', storyPoints: 5, team: teamA2._id, sprint: activeSprint._id, assignedTo: createdStudents['ASHI QUE R']._id, status: 'To-Do' }
            ]);
        }

        console.log('✅ Database seeded successfully with all review data!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedDatabase();