// --- IMPORTS ---
const Team = require('../models/Team');
const Student = require('../models/Student');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const BacklogItem = require('../models/BacklogItem');
const Proposal = require('../models/Proposal');
const Domain = require('../models/Domain');
const DailyLog = require('../models/DailyLog');
const Deliverable = require('../models/Deliverable');
const Setting = require('../models/Setting');
const { getTaskStatusInfo } = require('../helpers/taskHelper');
const Reminder = require('../models/Reminder');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const Login = require('../models/Login');
const bcrypt = require('bcryptjs');

// --- DASHBOARD ---
// exports.getDashboard = async (req, res) => {
//     try {
//         const studentId = req.session.user.profileId;
//         const startOfToday = new Date();
//         startOfToday.setHours(0, 0, 0, 0);
//         const endOfToday = new Date();
//         endOfToday.setHours(23, 59, 59, 999);

//         const team = await Team.findOne({ students: studentId });
//         const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

//         let activeSprint = null;
//         if (team && sprintSetting && sprintSetting.value === 'team') {
//             activeSprint = await Sprint.findOne({
//                 team: team._id,
//                 startDate: { $lte: endOfToday },
//                 endDate: { $gte: startOfToday },
//                 status: 'Active'
//             });
//         } else if (sprintSetting && sprintSetting.value === 'global') {
//             activeSprint = await Sprint.findOne({
//                 team: { $exists: false },
//                 startDate: { $lte: endOfToday },
//                 endDate: { $gte: startOfToday },
//                 status: 'Active'
//             });
//         }

//         let teamTasks = [], totalStoryPoints = 0, completedStoryPoints = 0, burndownChartData = null, deliverables = [];
//         let overallTotalPoints = 0, overallCompletedPoints = 0, teamTotalPlannedPoints = 0;

//         if (team) {
//             const allSprints = await Sprint.find({});
//             overallTotalPoints = allSprints.reduce((sum, sprint) => sum + (sprint.capacity || 0), 0);
            
//             const allCompletedTasks = await Task.find({ team: team._id, status: 'Done' });
//             overallCompletedPoints = allCompletedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

//             if (sprintSetting && sprintSetting.value === 'team') {
//                 const teamSprints = await Sprint.find({ team: team._id });
//                 teamTotalPlannedPoints = teamSprints.reduce((sum, sprint) => sum + (sprint.capacity || 0), 0);
//             }

//             deliverables = await Deliverable.find({ team: team._id }).populate('uploadedBy', 'name').sort({ createdAt: -1 });

//             if (activeSprint) {
//                 teamTasks = await Task.find({ team: team._id, sprint: activeSprint._id }).populate('assignedTo', 'name');
                
//                 teamTasks = teamTasks.map(task => {
//                     task.realtimeStatus = getTaskStatusInfo(task, activeSprint);
//                     return task;
//                 });

//                 totalStoryPoints = teamTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
//                 completedStoryPoints = teamTasks.filter(task => task.status === 'Done').reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                
//                 const sprintStartDate = new Date(activeSprint.startDate);
//                 const sprintEndDate = new Date(activeSprint.endDate);
//                 const labels = [], idealData = [], actualData = [];
//                 let remainingPoints = totalStoryPoints;
//                 const totalSprintDays = (sprintEndDate - sprintStartDate) / (1000 * 60 * 60 * 24) + 1;
//                 const idealBurnPerDay = totalStoryPoints / (totalSprintDays > 0 ? totalSprintDays : 1);

//                 for (let d = new Date(sprintStartDate); d <= sprintEndDate; d.setDate(d.getDate() + 1)) {
//                     if (d > endOfToday) break;
//                     labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
//                     const daysPassed = (d - sprintStartDate) / (1000 * 60 * 60 * 24);
//                     idealData.push(Math.round(totalStoryPoints - (daysPassed * idealBurnPerDay)));
//                     const pointsCompletedOnThisDay = teamTasks.filter(task => task.status === 'Done' && new Date(task.updatedAt).toDateString() === d.toDateString()).reduce((sum, task) => sum + (task.storyPoints || 0), 0);
//                     remainingPoints -= pointsCompletedOnThisDay;
//                     actualData.push(remainingPoints);
//                 }
                
//                 burndownChartData = {
//                     labels: JSON.stringify(labels),
//                     actualData: JSON.stringify(actualData),
//                     idealData: JSON.stringify(idealData),
//                 };
//             }
//         }

//         res.render('student/dashboard', {
//             title: 'Student Dashboard',
//             user: req.session.user,
//             team,
//             activeSprint,
//             teamTasks,
//             totalStoryPoints,
//             completedStoryPoints,
//             burndownChartData,
//             deliverables,
//             overallTotalPoints,
//             overallCompletedPoints,
//             teamTotalPlannedPoints,
//             sprintSetting: sprintSetting || { value: 'global' }
//         });

//     } catch (error) {
//         console.error("Error loading student dashboard:", error);
//         req.flash('error_msg', 'Could not load your dashboard.');
//         res.redirect('/login');
//     }
// };
// exports.getDashboard = async (req, res) => {
//     try {
//         const studentId = req.session.user.profileId;
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         const endOfToday = new Date();
// endOfToday.setHours(23, 59, 59, 999);

//         const team = await Team.findOne({ students: studentId });
//         const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

//         let activeSprint;
//         if (team && sprintSetting && sprintSetting.value === 'team') {
//             activeSprint = await Sprint.findOne({
//                 team: team._id,
//                 startDate: { $lte: today },
//                 endDate: { $gte: today },
//                  status: { $in: ['Active', 'Pending'] } 
//             });
//         } else {
//             activeSprint = await Sprint.findOne({
//                 team: { $exists: false },
//                 startDate: { $lte: today },
//                 endDate: { $gte: today },
//                 status: { $in: ['Active', 'Pending'] }
//             });
//         }

//         let teamTasks = [], totalStoryPoints = 0, completedStoryPoints = 0, burndownChartData = null, deliverables = [];
//         let overallTotalPoints = 0, overallCompletedPoints = 0, teamTotalPlannedPoints = 0;

//         if (team) {
//             const allSprints = await Sprint.find({});
//             overallTotalPoints = allSprints.reduce((sum, sprint) => sum + (sprint.capacity || 0), 0);
            
//             const allCompletedTasks = await Task.find({ team: team._id, status: 'Done' });
//             overallCompletedPoints = allCompletedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

//             if (sprintSetting && sprintSetting.value === 'team') {
//                 const teamSprints = await Sprint.find({ team: team._id });
//                 teamTotalPlannedPoints = teamSprints.reduce((sum, sprint) => sum + (sprint.capacity || 0), 0);
//             }

//             deliverables = await Deliverable.find({ team: team._id }).populate('uploadedBy', 'name').sort({ createdAt: -1 });

//             if (activeSprint) {
//                 teamTasks = await Task.find({ team: team._id, sprint: activeSprint._id }).populate('assignedTo', 'name');
//                 teamTasks.forEach(task => {
//                     task.realtimeStatus = getTaskStatusInfo(task, activeSprint);
//                 });

//                 totalStoryPoints = teamTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
//                 completedStoryPoints = teamTasks.filter(task => task.status === 'Done').reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                
//                 // --- BURNDOWN CHART CALCULATION BLOCK ---
//                 const sprintStartDate = new Date(activeSprint.startDate);
//                 const sprintEndDate = new Date(activeSprint.endDate);
//                 const labels = [], idealData = [], actualData = [];
//                 let remainingPoints = totalStoryPoints;
//                 const totalSprintDays = (sprintEndDate - sprintStartDate) / (1000 * 60 * 60 * 24) + 1;
//                 const idealBurnPerDay = totalStoryPoints / (totalSprintDays > 0 ? totalSprintDays : 1);

//                 for (let d = new Date(sprintStartDate); d <= sprintEndDate; d.setDate(d.getDate() + 1)) {
//                     if (d > new Date()) break;
//                     labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
//                     const daysPassed = (d - sprintStartDate) / (1000 * 60 * 60 * 24);
//                     idealData.push(Math.round(totalStoryPoints - (daysPassed * idealBurnPerDay)));
//                     const pointsCompletedOnThisDay = teamTasks.filter(task => task.status === 'Done' && new Date(task.updatedAt).toDateString() === d.toDateString()).reduce((sum, task) => sum + (task.storyPoints || 0), 0);
//                     remainingPoints -= pointsCompletedOnThisDay;
//                     actualData.push(remainingPoints);
//                 }
//                 burndownChartData = {
//                     labels: JSON.stringify(labels),
//                     actualData: JSON.stringify(actualData),
//                     idealData: JSON.stringify(idealData),
//                 };
//                 // --- END OF CALCULATION ---
//             }
//         }
        
//         // --- If the bug persists, this log will tell us why ---
//         console.log('Data being sent to view:', { 
//             hasActiveSprint: !!activeSprint, 
//             hasBurndownData: !!burndownChartData 
//         });

//         res.render('student/dashboard', {
//             title: 'Student Dashboard',
//             user: req.session.user,
//             team,
//             activeSprint,
//             teamTasks,
//             totalStoryPoints,
//             completedStoryPoints,
//             burndownChartData, // <-- Ensure this is passed
//             deliverables,
//             overallTotalPoints,
//             overallCompletedPoints,
//             teamTotalPlannedPoints,
//             sprintSetting: sprintSetting || { value: 'global' }
//         });

//     } catch (error) {
//         console.error("Error loading student dashboard:", error);
//         req.flash('error_msg', 'Could not load your dashboard.');
//         res.redirect('/login');
//     }
// // };
exports.getDashboard = async (req, res) => {
    try {
        const studentId = req.session.user.profileId;
        const today = new Date();
        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

        const team = await Team.findOne({ students: studentId }).populate('guide', 'name').populate('students', 'name studentIdNumber');
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        let activeSprint;
        if (team && sprintSetting && sprintSetting.value === 'team') {
            activeSprint = await Sprint.findOne({
                team: team._id, startDate: { $lte: endOfToday }, endDate: { $gte: startOfToday },
                status: { $in: ['Active', 'Pending'] }
            });
        } else {
            activeSprint = await Sprint.findOne({
                team: { $exists: false }, startDate: { $lte: endOfToday }, endDate: { $gte: startOfToday },
                status: { $in: ['Active', 'Pending'] }
            });
        }

        let teamTasks = [], totalStoryPoints = 0, completedStoryPoints = 0, burndownChartData = null, deliverables = [];
        let overallTotalPoints = 0, overallCompletedPoints = 0, teamTotalPlannedPoints = 0;
        
        // --- CALENDAR LOGIC ---
        let calendarEvents = [];
        // 1. Fetch reminders visible to students
        const reminders = await Reminder.find({ targetRole: { $in: ['all', 'student'] } });
        reminders.forEach(reminder => {
            calendarEvents.push({
                title: reminder.title,
                start: reminder.date,
                allDay: true,
                backgroundColor: '#e74a3b', // Red for admin reminders
                borderColor: '#e74a3b'
            });
        });

        // --- NEW: Fetch past sprints and upcoming reviews for the dashboard ---
        let pastSprints = [];
        let upcomingReviews = [];
        if (team) {
            pastSprints = await Sprint.find({ team: team._id, status: 'Completed' }).sort({ endDate: -1 }).limit(5);
            for(const sprint of pastSprints) {
                const tasks = await Task.find({ sprint: sprint._id, status: 'Done' });
                sprint.completed = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
            }
            upcomingReviews = await Review.find({ team: team._id, reviewDate: { $gte: new Date() } }).sort({ reviewDate: 'asc' }).limit(3);
        }

        if (team) {
            let projectSprints = [];
            if (sprintSetting && sprintSetting.value === 'team') {
                projectSprints = await Sprint.find({ team: team._id });
            } else {
                projectSprints = await Sprint.find({ team: { $exists: false } });
            }
            overallTotalPoints = projectSprints.reduce((sum, sprint) => sum + (sprint.capacity || 0), 0);
            
            const allCompletedTasks = await Task.find({ team: team._id, status: 'Done' });
            overallCompletedPoints = allCompletedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

            // --- FIX: Add missing properties to team object ---
            const proposal = await Proposal.findOne({ team: team._id, status: 'Approved' }).populate('domain');
            team.domainName = proposal && proposal.domain ? proposal.domain.name : 'N/A';
            team.overallCompletedPoints = overallCompletedPoints;
            team.overallTotalPoints = overallTotalPoints;

            if (sprintSetting && sprintSetting.value === 'team') {
                const teamSprints = await Sprint.find({ team: team._id });
                teamTotalPlannedPoints = teamSprints.reduce((sum, sprint) => sum + (sprint.capacity || 0), 0);
            }

            deliverables = await Deliverable.find({ team: team._id }).populate('uploadedBy', 'name').sort({ createdAt: -1 });

            if (activeSprint) {
                const allTasks = await Task.find({ team: team._id, sprint: activeSprint._id }).populate('assignedTo', 'name');

                // --- FIX: Add missing properties for progress bars ---
                team.sprintCapacity = activeSprint.capacity;
                team.completedStoryPoints = allTasks.filter(task => task.status === 'Done').reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                team.activeSprintName = activeSprint.name;
                // --- FIX: Add missing properties for progress bars ---
                team.sprintCapacity = activeSprint.capacity;
                team.completedStoryPoints = allTasks.filter(task => task.status === 'Done').reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                team.activeSprintName = activeSprint.name;
                
                // Group tasks that were assigned to all members
                const groupedTasks = [];
                const processedTasks = new Set();
                
                allTasks.forEach(task => {
                    if (processedTasks.has(task._id)) return;
                    
                    if (task.assignedToAll) {
                        // Find all tasks with same description, storyPoints, startDate, endDate that were assigned to all
                        const similarTasks = allTasks.filter(t => 
                            t.assignedToAll && 
                            t.description === task.description &&
                            t.storyPoints === task.storyPoints &&
                            t.startDate.getTime() === task.startDate.getTime() &&
                            t.endDate.getTime() === task.endDate.getTime()
                        );
                        
                        // Mark all similar tasks as processed
                        similarTasks.forEach(t => processedTasks.add(t._id));
                        
                        // Create a grouped task object
                        const groupedTask = {
                            ...task.toObject(),
                            _id: task._id, // Use the first task's ID
                            assignedToAll: true,
                            realtimeStatus: getTaskStatusInfo(task, activeSprint)
                        };
                        groupedTasks.push(groupedTask);
                    } else {
                        // Regular task, not assigned to all
                        task.realtimeStatus = getTaskStatusInfo(task, activeSprint);
                        groupedTasks.push(task);
                        processedTasks.add(task._id);
                    }
                });
                
                teamTasks = groupedTasks;
                
                totalStoryPoints = activeSprint.capacity || 0; 
                completedStoryPoints = allTasks.filter(task => task.status === 'Done').reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                
                // Burndown Chart Logic
                const sprintStartDate = new Date(activeSprint.startDate);
                const sprintEndDate = new Date(activeSprint.endDate);
                const labels = [], idealData = [], actualData = [];
                let remainingPoints = activeSprint.capacity;
                const totalSprintDays = (sprintEndDate - sprintStartDate) / (1000 * 60 * 60 * 24) + 1;
                const idealBurnPerDay = activeSprint.capacity / (totalSprintDays > 0 ? totalSprintDays : 1);

                const now = new Date();
                now.setHours(23, 59, 59, 999);

                for (let d = new Date(sprintStartDate); d <= sprintEndDate; d.setDate(d.getDate() + 1)) {
                    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                    const daysPassed = (d - sprintStartDate) / (1000 * 60 * 60 * 24);
                    let idealRemaining = Math.round(activeSprint.capacity - (daysPassed * idealBurnPerDay));
                    if (idealRemaining < 0) idealRemaining = 0;
                    idealData.push(idealRemaining);

                    if (d <= now) {
                        const pointsCompletedOnThisDay = allTasks.filter(task => task.status === 'Done' && new Date(task.updatedAt).toDateString() === d.toDateString()).reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                        remainingPoints -= pointsCompletedOnThisDay;
                        actualData.push(remainingPoints);
                    }
                }
                burndownChartData = {
                    labels: JSON.stringify(labels),
                    actualData: JSON.stringify(actualData),
                    idealData: JSON.stringify(idealData),
                };

                // 2. Add the active sprint to the calendar
                calendarEvents.push({
                    title: `${activeSprint.name} (Sprint)`,
                    start: activeSprint.startDate,
                    end: new Date(new Date(activeSprint.endDate).setDate(activeSprint.endDate.getDate() + 1)), // Adjust end date for FullCalendar
                    backgroundColor: '#4e73df', // Blue for sprints
                    borderColor: '#4e73df'
                });
            }
        }

        res.render('student/dashboard', {
            title: 'Student Dashboard',
            user: req.session.user,
            team,
            activeSprint,
            teamTasks,
            totalStoryPoints,
            completedStoryPoints,
            burndownChartData,
            deliverables,
            overallTotalPoints,
            overallCompletedPoints,
            teamTotalPlannedPoints,
            sprintSetting: sprintSetting || { value: 'global' },
            calendarEvents,
            pastSprints,      // <-- Pass past sprints
            upcomingReviews   // <-- Pass upcoming reviews
        });

    } catch (error) {
        console.error("Error loading student dashboard:", error);
        req.flash('error_msg', 'Could not load your dashboard.');
        res.redirect('/login');
    }
};
// exports.getDashboard = async (req, res) => {
//     try {
//         const studentId = req.session.user.profileId;
//         const today = new Date();
//         const startOfToday = new Date();
//         startOfToday.setHours(0, 0, 0, 0);
//         const endOfToday = new Date();
//         endOfToday.setHours(23, 59, 59, 999);

//         const team = await Team.findOne({ students: studentId });
//         const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

//         let activeSprint;
//         if (team && sprintSetting && sprintSetting.value === 'team') {
//             activeSprint = await Sprint.findOne({
//                 team: team._id,
//                 startDate: { $lte: endOfToday },
//                 endDate: { $gte: startOfToday },
//                 status: { $in: ['Active', 'Pending'] }
//             });
//         } else {
//             activeSprint = await Sprint.findOne({
//                 team: { $exists: false },
//                 startDate: { $lte: endOfToday },
//                 endDate: { $gte: startOfToday },
//                 status: { $in: ['Active', 'Pending'] }
//             });
//         }

//         let teamTasks = [], totalStoryPoints = 0, completedStoryPoints = 0, burndownChartData = null, deliverables = [];
//         let overallTotalPoints = 0, overallCompletedPoints = 0, teamTotalPlannedPoints = 0;

//         if (team) {
//             const allSprints = await Sprint.find({});
//             overallTotalPoints = allSprints.reduce((sum, sprint) => sum + (sprint.capacity || 0), 0);
            
//             const allCompletedTasks = await Task.find({ team: team._id, status: 'Done' });
//             overallCompletedPoints = allCompletedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

//             if (sprintSetting && sprintSetting.value === 'team') {
//                 const teamSprints = await Sprint.find({ team: team._id });
//                 teamTotalPlannedPoints = teamSprints.reduce((sum, sprint) => sum + (sprint.capacity || 0), 0);
//             }

//             deliverables = await Deliverable.find({ team: team._id }).populate('uploadedBy', 'name').sort({ createdAt: -1 });

//             if (activeSprint) {
//                 teamTasks = await Task.find({ team: team._id, sprint: activeSprint._id }).populate('assignedTo', 'name');
//                 teamTasks.forEach(task => {
//                     task.realtimeStatus = getTaskStatusInfo(task, activeSprint);
//                 });
                
//                 // --- KEY CHANGE ---
//                 // Base progress on the sprint's total capacity
//                 totalStoryPoints = activeSprint.capacity; 
//                 completedStoryPoints = teamTasks.filter(task => task.status === 'Done').reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                
//                 // --- BURNDOWN CHART CORRECTION ---
//                 const sprintStartDate = new Date(activeSprint.startDate);
//                 const sprintEndDate = new Date(activeSprint.endDate);
//                 const labels = [], idealData = [], actualData = [];

//                 let remainingPoints = activeSprint.capacity; // Start from full capacity
//                 const totalSprintDays = (sprintEndDate - sprintStartDate) / (1000 * 60 * 60 * 24) + 1;
//                 const idealBurnPerDay = activeSprint.capacity / (totalSprintDays > 0 ? totalSprintDays : 1);

//                 for (let d = new Date(sprintStartDate); d <= sprintEndDate; d.setDate(d.getDate() + 1)) {
//                     if (d > today) break;
//                     labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
//                     const daysPassed = (d - sprintStartDate) / (1000 * 60 * 60 * 24);
//                     idealData.push(Math.round(activeSprint.capacity - (daysPassed * idealBurnPerDay)));
//                     const pointsCompletedOnThisDay = teamTasks.filter(task => task.status === 'Done' && new Date(task.updatedAt).toDateString() === d.toDateString()).reduce((sum, task) => sum + (task.storyPoints || 0), 0);
//                     remainingPoints -= pointsCompletedOnThisDay;
//                     actualData.push(remainingPoints);
//                 }
//                 burndownChartData = {
//                     labels: JSON.stringify(labels),
//                     actualData: JSON.stringify(actualData),
//                     idealData: JSON.stringify(idealData),
//                 };
//             }
//         }
//         let calendarEvents = []; // Initialize an empty array for calendar events

//         // 1. Fetch reminders visible to students
//         const reminders = await Reminder.find({ targetRole: { $in: ['all', 'student'] } });
//         reminders.forEach(reminder => {
//             calendarEvents.push({
//                 title: reminder.title,
//                 start: reminder.date,
//                 allDay: true,
//                 backgroundColor: '#e74a3b', // Red for admin reminders
//                 borderColor: '#e74a3b'
//             });
//         });

//         // 2. Add the active sprint to the calendar
//         if (activeSprint) {
//             calendarEvents.push({
//                 title: `${activeSprint.name} (Sprint)`,
//                 start: activeSprint.startDate,
//                 end: new Date(new Date(activeSprint.endDate).setDate(activeSprint.endDate.getDate() + 1)), // Adjust end date
//                 backgroundColor: '#4e73df', // Blue for sprints
//                 borderColor: '#4e73df'
//             });
//         }

//         res.render('student/dashboard', {
//             title: 'Student Dashboard',
//             user: req.session.user,
//             team,
//             activeSprint,
//             teamTasks,
//             totalStoryPoints,
//             completedStoryPoints,
//             burndownChartData,
//             deliverables,
//             overallTotalPoints,
//             overallCompletedPoints,
//             teamTotalPlannedPoints,
//             calendarEvents,
//             sprintSetting: sprintSetting || { value: 'global' }
//         });

//     } catch (error) {
//         console.error("Error loading student dashboard:", error);
//         req.flash('error_msg', 'Could not load your dashboard.');
//         res.redirect('/login');
//     }
// };
// --- TASK & DELIVERABLE MANAGEMENT ---
exports.createTask = async (req, res) => {
    try {
        const { description, storyPoints, sprintId, teamId, backlogItemId, startDate, endDate, assignToAll, assignedTo } = req.body;
        const errorRedirectPath = backlogItemId ? `/student/backlog/${backlogItemId}/plan` : '/student/dashboard';

        // --- PERMISSION CHECK ---
        const team = await Team.findById(teamId);
        if (!team) {
            req.flash('error_msg', 'Team not found.');
            return res.redirect(errorRedirectPath);
        }

        const user = req.session.user;

        // Verify that the student is actually a member of this team
        const isMember = team.students.some(s => s.toString() === user.profileId.toString());
        if (!isMember) {
            req.flash('error_msg', 'You are not a member of this team.');
            return res.redirect(errorRedirectPath);
        }

        const isGuide = user.role === 'guide';
        const isTaskMaster = team.taskMaster && team.taskMaster.equals(user.profileId);

        if (team.taskAssignmentPermission === 'guide-only' && !isGuide) {
            req.flash('error_msg', 'Only the guide can assign tasks for this team.');
            return res.redirect(errorRedirectPath);
        }

        if (team.taskAssignmentPermission === 'guide-and-designated-student' && !isGuide && !isTaskMaster) {
            req.flash('error_msg', 'Only the guide or the designated task master can assign tasks.');
            return res.redirect(errorRedirectPath);
        }
        // --- END PERMISSION CHECK ---

        const newStoryPoints = parseInt(storyPoints, 10);

        if (isNaN(newStoryPoints) || newStoryPoints <= 0) {
            req.flash('error_msg', 'Hours must be a valid number greater than 0.');
            return res.redirect(errorRedirectPath);
        }

        // Validate dates
        const taskStartDate = new Date(startDate);
        const taskEndDate = new Date(endDate);
        
        if (isNaN(taskStartDate.getTime()) || isNaN(taskEndDate.getTime())) {
            req.flash('error_msg', 'Please provide valid start and end dates.');
            return res.redirect(errorRedirectPath);
        }

        if (taskStartDate >= taskEndDate) {
            req.flash('error_msg', 'End date must be after start date.');
            return res.redirect(errorRedirectPath);
        }

        const sprint = await Sprint.findById(sprintId);
        if (!sprint) {
            req.flash('error_msg', 'Active sprint not found.');
            return res.redirect(errorRedirectPath);
        }

        // Validate task dates are within sprint dates
        const sprintStartDate = new Date(sprint.startDate);
        const sprintEndDate = new Date(sprint.endDate);
        
        if (taskStartDate < sprintStartDate || taskEndDate > sprintEndDate) {
            req.flash('error_msg', 'Task dates must be within the sprint period.');
            return res.redirect(errorRedirectPath);
        }

        const tasks = await Task.find({ team: teamId, sprint: sprintId });
        
        // Group tasks to calculate capacity correctly
        const groupedTasks = [];
        const processedTasks = new Set();
        
        tasks.forEach(task => {
            if (processedTasks.has(task._id)) return;
            
            if (task.assignedToAll) {
                // Find all tasks with same description, storyPoints, startDate, endDate that were assigned to all
                const similarTasks = tasks.filter(t => 
                    t.assignedToAll && 
                    t.description === task.description &&
                    t.storyPoints === task.storyPoints &&
                    t.startDate.getTime() === task.startDate.getTime() &&
                    t.endDate.getTime() === task.endDate.getTime()
                );
                
                // Mark all similar tasks as processed
                similarTasks.forEach(t => processedTasks.add(t._id));
                
                // Add only one task to the grouped list for capacity calculation
                groupedTasks.push(task);
            } else {
                // Regular task, not assigned to all
                groupedTasks.push(task);
                processedTasks.add(task._id);
            }
        });
        
        const currentLoad = groupedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
        if ((currentLoad + newStoryPoints) > sprint.capacity) {
            req.flash('error_msg', `Cannot add task. Exceeds sprint capacity of ${sprint.capacity}.`);
            return res.redirect(errorRedirectPath);
        }

        // Handle assignment logic
        if (assignToAll === 'true') {
            // Create a single task representing assignment to all members
            const newTask = new Task({
                description,
                storyPoints: newStoryPoints,
                sprint: sprintId,
                team: teamId,
                assignedTo: undefined,
                startDate: taskStartDate,
                endDate: taskEndDate,
                assignedToAll: true
            });
            await newTask.save();
            req.flash('success_msg', 'Task assigned to all team members!');
        } else {
            let assignee = user.profileId; // Default to self-assignment for task master
            if ((isGuide || isTaskMaster) && assignedTo) {
                assignee = assignedTo; // Guide or Task Master assigns to a specific student
            }
            // Create single task assigned to current user
            const newTask = new Task({
                description,
                storyPoints: newStoryPoints,
                sprint: sprintId,
                team: teamId,
                assignedTo: assignee,
                startDate: taskStartDate,
                endDate: taskEndDate
            });
            await newTask.save();
            req.flash('success_msg', 'Task added successfully!');
        }

        if (backlogItemId) {
            await BacklogItem.findByIdAndUpdate(backlogItemId, { status: 'In Sprint' });
        }

        const successRedirectPath = backlogItemId ? '/student/sprint-planning' : '/student/dashboard';
        res.redirect(successRedirectPath);

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred while creating the task.');
        res.redirect('/student/dashboard');
    }
};

exports.updateTaskStatus = async (req, res) => {
    try {
        const taskId = req.params.id;
        const newStatus = req.body.status;
        const studentId = req.session.user.profileId;
        const team = await Team.findOne({ students: studentId });

        if (!team) {
            req.flash('error_msg', 'You are not part of a team.');
            return res.redirect('/student/dashboard');
        }

        const task = await Task.findOne({ _id: taskId, team: team._id });
        
        if (!task) {
            req.flash('error_msg', 'Task not found or it does not belong to your team.');
            return res.redirect('/student/dashboard');
        }

        if (task.assignedToAll) {
            // If this task was assigned to all members, update all similar tasks
            const similarTasks = await Task.find({
                team: team._id,
                assignedToAll: true,
                description: task.description,
                storyPoints: task.storyPoints,
                startDate: task.startDate,
                endDate: task.endDate
            });
            
            // Update all similar tasks
            await Task.updateMany(
                { _id: { $in: similarTasks.map(t => t._id) } },
                { status: newStatus, updatedAt: new Date() }
            );
        } else {
            // Regular task, update just this one
            await Task.findByIdAndUpdate(taskId, { 
                status: newStatus, 
                updatedAt: new Date() 
            });
        }

        res.redirect('/student/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred while updating the task.');
        res.redirect('/student/dashboard');
    }
};

exports.getUploadPage = async (req, res) => {
    try {
        const team = await Team.findOne({ students: req.session.user.profileId });
        let tasks = [], deliverables = [];
        if (team) {
            tasks = await Task.find({ team: team._id });
            // Fetch deliverables for the team
            deliverables = await Deliverable.find({ team: team._id })
                .populate('uploadedBy', 'name')
                .sort({ createdAt: -1 });
        }
        res.render('student/upload', { 
            title: 'Upload Deliverable', 
            tasks, 
            team,
            deliverables // Pass deliverables to the view
        });
    } catch (error) {
        req.flash('error_msg', 'Could not load upload page.');
        res.redirect('/student/dashboard');
    }
};
exports.postUpload = async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error_msg', 'No file was selected. Please choose a file to upload.');
            return res.redirect('/student/upload');
        }
        const { teamId, taskId } = req.body;
        const newDeliverable = new Deliverable({
            fileName: req.file.originalname,
            filePath: req.file.path,
            fileType: req.file.mimetype,
            uploadedBy: req.session.user.profileId,
            team: teamId,
            task: taskId || null
        });
        await newDeliverable.save();
        req.flash('success_msg', 'File uploaded successfully!');
        res.redirect('/student/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred during file upload.');
        res.redirect('/student/upload');
    }
};

// --- PROPOSAL MANAGEMENT ---
exports.getProposalPage = async (req, res) => {
    try {
        const team = await Team.findOne({ students: req.session.user.profileId });
        let existingProposal = null;
        if (team) {
            existingProposal = await Proposal.findOne({ team: team._id }).populate('domain');
        }
        const domains = await Domain.find({});
        res.render('student/proposal', { 
            title: 'Project Proposal', 
            user: req.session.user,
            proposal: existingProposal, 
            team, 
            domains 
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load proposal page.');
        res.redirect('/student/dashboard');
    }
};
exports.submitProposal = async (req, res) => {
    try {
        const { title, description, domain, teamId } = req.body;
        if (!teamId) {
            req.flash('error_msg', 'You must be part of a team to submit a proposal.');
            return res.redirect('/student/proposal');
        }
        const existingProposal = await Proposal.findOne({ team: teamId });
        if (existingProposal) {
            req.flash('error_msg', 'Your team has already submitted a proposal.');
            return res.redirect('/student/proposal');
        }
        const newProposal = new Proposal({ title, description, domain, team: teamId });
        await newProposal.save();
        req.flash('success_msg', 'Your proposal has been submitted for approval.');
        res.redirect('/student/proposal');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred while submitting your proposal.');
        res.redirect('/student/proposal');
    }
};
exports.getEditProposalPage = async (req, res) => {
    try {
        const team = await Team.findOne({ students: req.session.user.profileId });
        const proposal = await Proposal.findOne({ team: team._id, status: 'Rejected' });
        const domains = await Domain.find({});
        res.render('student/edit-proposal', { 
            title: 'Edit Proposal', 
            user: req.session.user,
            proposal, 
            domains 
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load the edit proposal page.');
        res.redirect('/student/proposal');
    }
};
exports.updateProposal = async (req, res) => {
    try {
        const team = await Team.findOne({ students: req.session.user.profileId });
        const { title, description, domain } = req.body;
        await Proposal.findOneAndUpdate({ team: team._id, status: 'Rejected' }, { title, description, domain, status: 'Pending Guide Approval', adminFeedback: '', guideFeedback: '' });
        req.flash('success_msg', 'Your proposal has been updated and resubmitted.');
        res.redirect('/student/proposal');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred while updating your proposal.');
        res.redirect('/student/proposal');
    }
};

// --- BACKLOG & SPRINT PLANNING ---
exports.getBacklogPage = async (req, res) => {
    try {
        const team = await Team.findOne({ students: req.session.user.profileId });
        let backlogItems = [];
        if (team) {
            backlogItems = await BacklogItem.find({ team: team._id }).sort({ priority: 1, createdAt: -1 });
        }
        res.render('student/backlog', { 
            title: 'Project Backlog', 
            user: req.session.user,
            backlogItems, 
            team 
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load backlog.');
        res.redirect('/student/dashboard');
    }
};
exports.createBacklogItem = async (req, res) => {
    try {
        const { description, priority, teamId } = req.body;
        const newBacklogItem = new BacklogItem({ description, priority, team: teamId });
        await newBacklogItem.save();
        req.flash('success_msg', 'Backlog item added!');
        res.redirect('/student/backlog');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Failed to add backlog item.');
        res.redirect('/student/backlog');
    }
};
exports.getSprintPlanningPage = async (req, res) => {
    try {
        const team = await Team.findOne({ students: req.session.user.profileId });
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let activeSprint;
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        if (team && sprintSetting && sprintSetting.value === 'team') {
            activeSprint = await Sprint.findOne({ 
                team: team._id, 
                startDate: { $lte: today }, 
                endDate: { $gte: today } 
            });
        } else {
            activeSprint = await Sprint.findOne({ 
                startDate: { $lte: today }, 
                endDate: { $gte: today } 
            });
        }

        let backlogItems = [], sprintTasks = [];
        if (team) {
            backlogItems = await BacklogItem.find({ team: team._id, status: 'New' }).select('description priority');
            if (activeSprint) {
                sprintTasks = await Task.find({ team: team._id, sprint: activeSprint._id });
            }
        }
        res.render('student/sprint-planning', { 
            title: 'Sprint Planning', 
            user: req.session.user,
            backlogItems, 
            sprintTasks, 
            activeSprint,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load sprint planning page.');
        res.redirect('/student/dashboard');
    }
};
exports.getPlanTaskPage = async (req, res) => {
    try {
        const backlogItem = await BacklogItem.findById(req.params.id);
        const team = await Team.findOne({ students: req.session.user.profileId }).populate('students');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let activeSprint;
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        if (team && sprintSetting && sprintSetting.value === 'team') {
            activeSprint = await Sprint.findOne({ 
                team: team._id, 
                startDate: { $lte: today }, 
                endDate: { $gte: today } 
            });
        } else {
            activeSprint = await Sprint.findOne({ 
                startDate: { $lte: today }, 
                endDate: { $gte: today } 
            });
        }

        if (!backlogItem || !team || !activeSprint) {
            req.flash('error_msg', 'Cannot plan task: a required item was not found.');
            return res.redirect('/student/sprint-planning');
        }

        // --- PERMISSION CHECK ---
        const user = req.session.user;
        const isGuide = user.role === 'guide';
        const isTaskMaster = team.taskMaster && team.taskMaster.equals(user.profileId);
        let canCreateTask = false;
        if (team.taskAssignmentPermission === 'guide-only' && isGuide) {
            canCreateTask = true;
        }
        if (team.taskAssignmentPermission === 'guide-and-designated-student' && (isGuide || isTaskMaster)) {
            canCreateTask = true;
        }
        // --- END PERMISSION CHECK ---

        res.render('student/plan-task', { 
            title: 'Plan Task', 
            user: req.session.user,
            backlogItem, 
            team, 
            activeSprint,
            canCreateTask // Pass the flag to the view
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- DAILY LOG & PAST SPRINTS ---
exports.getDailyLogPage = async (req, res) => {
    try {
        const studentId = req.session.user.profileId;
        const team = await Team.findOne({ students: studentId });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let activeSprint;
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        if (team && sprintSetting && sprintSetting.value === 'team') {
            activeSprint = await Sprint.findOne({ 
                team: team._id, 
                startDate: { $lte: today },
                endDate: { $gte: today },
                status: 'Active'
            });
        } else {
            activeSprint = await Sprint.findOne({ 
                startDate: { $lte: today },
                endDate: { $gte: today },
                status: 'Active'
            });
        }

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        let existingLog = null, dailyLogs = [];
        if (activeSprint) {
            existingLog = await DailyLog.findOne({ 
                student: studentId, 
                sprint: activeSprint._id, 
                createdAt: { $gte: today, $lt: tomorrow } 
            });
            // Fetch all logs for this student for the active sprint
            dailyLogs = await DailyLog.find({
                student: studentId,
                sprint: activeSprint._id
            }).sort({ createdAt: -1 });
        }
        res.render('student/daily-log', { 
            title: 'Daily Log', 
            activeSprint, 
            existingLog, 
            team,
            dailyLogs
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load the daily log page.');
        res.redirect('/student/dashboard');
    }
};
exports.submitDailyLog = async (req, res) => {
    try {
        const { logContent, isBlocked, blockerDescription, sprintId, teamId } = req.body;
        const studentId = req.session.user.profileId;
        const newLog = new DailyLog({
            logContent,
            isBlocked: isBlocked === 'on',
            blockerDescription,
            sprint: sprintId,
            team: teamId,
            student: studentId
        });
        await newLog.save();
        req.flash('success_msg', 'Your daily log has been submitted.');
        res.redirect('/student/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Something went wrong. Please try again.');
        res.redirect('/student/daily-log');
    }
};
exports.getPastSprints = async (req, res) => {
    try {
        const studentId = req.session.user.profileId;
        const team = await Team.findOne({ students: studentId });
        
        let pastSprints;
        pastSprints = await Sprint.find({ status: 'Completed' }).sort({ endDate: -1 });

        if (team) {
            await Promise.all(pastSprints.map(async (sprint) => {
                const tasks = await Task.find({ 
                    team: team._id,
                    $or: [{ sprint: sprint._id }, { originalSprint: sprint._id }]
                }).populate('sprint', 'name');
                sprint.tasks = tasks;
                
                if (tasks.length > 0) {
                    const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                    let lastCompletionDate = new Date(sprint.endDate);
                    tasks.forEach(t => {
                        if (t.status === 'Done' && new Date(t.updatedAt) > lastCompletionDate) {
                            lastCompletionDate = new Date(t.updatedAt);
                        }
                    });
                    let remainingPoints = totalStoryPoints;
                    const labels = [], actualData = [];
                    for (let d = new Date(sprint.startDate); d <= lastCompletionDate; d.setDate(d.getDate() + 1)) {
                        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                        const pointsCompleted = tasks.filter(t => t.status === 'Done' && new Date(t.updatedAt).toDateString() === d.toDateString()).reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                        remainingPoints -= pointsCompleted;
                        actualData.push(remainingPoints);
                    }
                    sprint.burndownChartData = {
                        labels: JSON.stringify(labels),
                        actualData: JSON.stringify(actualData)
                    };
                }
            }));
        }
        res.render('student/past-sprints', { 
            title: 'Past Sprints', 
            user: req.session.user,
            pastSprints 
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load past sprints.');
        res.redirect('/student/dashboard');
    }
};
// exports.getPastSprints = async (req, res) => {
//     try {
//         const studentId = req.session.user.profileId;
//         const team = await Team.findOne({ students: studentId });
        
//         let pastSprints = [];

//         if (team) {
//             // Fetch only the sprints relevant to the student's team
//             pastSprints = await Sprint.find({ team: team._id, status: 'Completed' })
//                 .sort({ endDate: -1 });

//             await Promise.all(pastSprints.map(async (sprint) => {
//                 const tasks = await Task.find({ 
//                     team: team._id,
//                     $or: [{ sprint: sprint._id }, { originalSprint: sprint._id }]
//                 }).populate('sprint', 'name').select('description status storyPoints isMoved');
//                 sprint.tasks = tasks;
                
//                 if (tasks.length > 0) {
//                     let lastCompletionDate = new Date(sprint.endDate);
//                     tasks.forEach(t => {
//                         if (t.status === 'Done' && new Date(t.updatedAt) > lastCompletionDate) {
//                             lastCompletionDate = new Date(t.updatedAt);
//                         }
//                     });
//                     const labels = [], actualData = [];
//                     for (let d = new Date(sprint.startDate); d <= lastCompletionDate; d.setDate(d.getDate() + 1)) {
//                         labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
//                         const pointsCompletedByThisDay = tasks.filter(t => t.status === 'Done' && new Date(t.updatedAt) <= d).reduce((sum, task) => sum + (task.storyPoints || 0), 0);
//                         actualData.push(sprint.capacity - pointsCompletedByThisDay);
//                     }
//                     sprint.burndownChartData = {
//                         labels: JSON.stringify(labels),
//                         actualData: JSON.stringify(actualData)
//                     };
//                 }
//             }));
//         }
//         res.render('student/past-sprints', { 
//             title: 'Past Sprints', 
//             user: req.session.user,
//             pastSprints 
//         });
//     } catch (error) {
//         console.error(error);
//         req.flash('error_msg', 'Could not load past sprints.');
//         res.redirect('/student/dashboard');
//     }
// };
exports.moveTaskToCurrentSprint = async (req, res) => {
    try {
        const taskId = req.params.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const team = await Task.findById(taskId).select('team');

        let activeSprint;
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        if (team && sprintSetting && sprintSetting.value === 'team') {
            activeSprint = await Sprint.findOne({ 
                team: team.team,
                startDate: { $lte: today }, 
                endDate: { $gte: today } 
            });
        } else {
            activeSprint = await Sprint.findOne({ 
                startDate: { $lte: today }, 
                endDate: { $gte: today } 
            });
        }

        if (!activeSprint) {
            req.flash('error_msg', 'There is no active sprint to move this task to.');
            return res.redirect('back');
        }

        const taskToMove = await Task.findById(taskId);
        await Task.findByIdAndUpdate(taskId, {
            sprint: activeSprint._id,
            originalSprint: taskToMove.sprint,
            status: 'To-Do',
            isMoved: true
        });
        req.flash('success_msg', 'Delayed task has been moved to the current sprint.');
        res.redirect('/student/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred while moving the task.');
        res.redirect('/student/past-sprints');
    }
};

// --- SPRINT MANAGEMENT BY STUDENT ---
exports.getSprintsPage = async (req, res) => {
    try {
        const studentId = req.session.user.profileId;
        const team = await Team.findOne({ students: studentId });

        if (!team) {
            req.flash('error_msg', 'You must be part of a team to manage sprints.');
            return res.redirect('/student/dashboard');
        }

        // --- PERMISSION CHECK ---
        const isTaskMaster = team.taskMaster && team.taskMaster.equals(studentId);
        const hasPermission = team.taskAssignmentPermission === 'guide-and-designated-student' && isTaskMaster;

        if (!hasPermission) {
            req.flash('error_msg', 'You do not have permission to manage sprints.');
            return res.redirect('/student/dashboard');
        }

        let sprints = [];
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        if (sprintSetting && sprintSetting.value === 'team') {
            sprints = await Sprint.find({ team: team._id }).sort({ startDate: -1 });
        }

        res.render('student/sprints', {
            title: 'Manage Sprints',
            user: req.session.user,
            team,
            sprints,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error("Error loading sprints page:", error);
        req.flash('error_msg', 'Could not load the sprints page.');
        res.redirect('/student/dashboard');
    }
};

exports.createSprint = async (req, res) => {
    try {
        // Sprint creation is now restricted to Guides only.
        req.flash('error_msg', 'Only Guides are authorized to create Sprints.');
        res.redirect('/student/dashboard');
        const studentId = req.session.user.profileId;
        const team = await Team.findOne({ students: studentId });

        if (!team) {
            return res.redirect('/student/dashboard');
        }

        // --- PERMISSION CHECK ---
        const isTaskMaster = team.taskMaster && team.taskMaster.equals(studentId);
        const hasPermission = team.taskAssignmentPermission === 'guide-and-designated-student' && isTaskMaster;

        if (!hasPermission) {
            req.flash('error_msg', 'Only the Guide or designated Task Master can create sprints.');
            return res.redirect('/student/dashboard');
        }

        const { name, startDate, endDate, capacity, goal } = req.body;

        if (!name || !startDate || !endDate || !capacity || !goal) {
            req.flash('error_msg', 'Please fill in all fields.');
            return res.redirect('/student/sprints');
        }

        const newSprint = new Sprint({
            name,
            startDate,
            endDate,
            capacity: parseInt(capacity, 10),
            team: team._id,
            goal,
            status: 'Active'
        });

        await newSprint.save();

        req.flash('success_msg', 'New sprint created successfully!');
        res.redirect('/student/sprints');
    } catch (error) {
        console.error("Error creating sprint:", error);
        req.flash('error_msg', 'An error occurred while creating the sprint.');
        res.redirect('/student/sprints');
    }
};

exports.postEditSprint = async (req, res) => {
    try {
        const studentId = req.session.user.profileId;
        const team = await Team.findOne({ students: studentId });

        if (!team) {
            return res.redirect('/student/dashboard');
        }

        // --- PERMISSION CHECK ---
        const isTaskMaster = team.taskMaster && team.taskMaster.equals(studentId);
        const hasPermission = team.taskAssignmentPermission === 'guide-and-designated-student' && isTaskMaster;

        if (!hasPermission) {
            req.flash('error_msg', 'You do not have permission to edit sprints.');
            return res.redirect('/student/dashboard');
        }

        const { name, startDate, endDate, capacity, goal, status } = req.body;

        await Sprint.findOneAndUpdate(
            { _id: req.params.sprintId, team: team._id },
            { name, startDate, endDate, capacity, goal, status }
        );

        req.flash('success_msg', 'Sprint updated successfully.');
        res.redirect('/student/sprints');
    } catch (error) {
        console.error("Error updating sprint:", error);
        req.flash('error_msg', 'Failed to update sprint.');
        res.redirect('/student/sprints');
    }
};

exports.postDeleteSprint = async (req, res) => {
    try {
        const studentId = req.session.user.profileId;
        const team = await Team.findOne({ students: studentId });

        if (!team) {
            return res.redirect('/student/dashboard');
        }

        // --- PERMISSION CHECK ---
        const isTaskMaster = team.taskMaster && team.taskMaster.equals(studentId);
        const hasPermission = team.taskAssignmentPermission === 'guide-and-designated-student' && isTaskMaster;

        if (!hasPermission) {
            req.flash('error_msg', 'You do not have permission to delete sprints.');
            return res.redirect('/student/sprints');
        }

        await Sprint.findOneAndDelete({ _id: req.params.sprintId, team: team._id });
        req.flash('success_msg', 'Sprint deleted successfully.');
        res.redirect('/student/sprints');
    } catch (error) {
        console.error("Error deleting sprint:", error);
        req.flash('error_msg', 'Failed to delete sprint.');
        res.redirect('/student/sprints');
    }
};

// Add Reminder to the top of your controller imports if not already there


exports.getCalendarPage = async (req, res) => {
    try {
        const studentId = req.session.user.profileId;
        const team = await Team.findOne({ students: studentId });
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        
        let calendarEvents = [];

        // 1. Fetch reminders for students
        const reminders = await Reminder.find({ targetRole: { $in: ['all', 'student'] } });
        reminders.forEach(reminder => {
            calendarEvents.push({
                title: reminder.title,
                start: reminder.date,
                allDay: true,
                backgroundColor: '#e74a3b', // Red
                borderColor: '#e74a3b'
            });
        });

        // 2. Fetch and add all of the team's sprints (active, upcoming, etc.)
        if (team) {
            const teamSprints = await Sprint.find({ team: team._id });
            teamSprints.forEach(sprint => {
                calendarEvents.push({
                    title: `${sprint.name}`,
                    start: sprint.startDate,
                    end: new Date(new Date(sprint.endDate).setDate(sprint.endDate.getDate() + 1)),
                    backgroundColor: '#4e73df', // Blue
                    borderColor: '#4e73df'
                });
            });
        }
        
        res.render('student/calendar', {
            title: 'Sprint Calendar',
            user: req.session.user,
            sprintSetting: sprintSetting || { value: 'global' },
            calendarEvents
        });

    } catch (error) {
        console.error("Error loading calendar page:", error);
        req.flash('error_msg', 'Could not load the calendar.');
        res.redirect('/student/dashboard');
    }
};

// Add the Review model to your imports at the top


// This function lists all reviews for the student's team
exports.getReviewsPage = async (req, res) => {
    try {
        const studentId = req.session.user.profileId;
        const team = await Team.findOne({ students: studentId });
        let reviews = [];

        if (team) {
            reviews = await Review.find({ team: team._id })
                .populate('panel', 'name') // <-- This is the fix
                .sort({ reviewDate: 'desc' });
        }

        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        res.render('student/my-reviews', {
            title: 'My Reviews',
            user: req.session.user,
            reviews,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load your reviews.');
        res.redirect('/student/dashboard');
    }
};

// This function shows the details and remarks for a single review
exports.getReviewDetailPage = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('team')
            .populate('panel', 'name')
            .populate('remarks.reviewer', 'name');

        if (!review) {
            req.flash('error_msg', 'Review not found.');
            return res.redirect('/student/reviews');
        }

        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        res.render('student/review-detail', {
            title: `Review Details`,
            user: req.session.user,
            review,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load review details.');
        res.redirect('/student/reviews');
    }
};
// --- NOTIFICATION ---
exports.postMarkNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification || !notification.recipient.equals(req.session.user.loginId)) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }
        notification.isRead = true;
        await notification.save();
        res.json({ success: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// // This function displays the list of notifications for the student
// exports.getNotificationsPage = async (req, res) => {
//     try {
//         // --- THIS IS THE FIX ---
//         // We must query using the user's 'loginId', not their 'profileId'
//         const notifications = await Notification.find({ recipient: req.session.user.loginId })
//             .sort({ createdAt: -1 });

//         const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

//         res.render('student/notifications', {
//             title: 'My Notifications',
//             user: req.session.user,
//             notifications,
//             sprintSetting: sprintSetting || { value: 'global' }
//         });
//     } catch (error) {
//         console.error('Error loading notifications page:', error);
//         req.flash('error_msg', 'Could not load your notifications.');
//         res.redirect('/student/dashboard');
//     }
// };

// This function displays the list of notifications for the student
exports.getNotificationsPage = async (req, res) => {
    try {
        // FIX: Use the user's loginId, which is the reference stored in the recipient field.
        const notifications = await Notification.find({ recipient: req.session.user.loginId })
            .sort({ createdAt: -1 });

        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        res.render('student/notifications', {
            title: 'My Notifications',
            user: req.session.user,
            notifications,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error('Error loading notifications page:', error);
        req.flash('error_msg', 'Could not load your notifications.');
        res.redirect('/student/dashboard');
    }
};

// This function handles the "Mark all as read" button
exports.postMarkAllRead = async (req, res) => {
    try {
       await Notification.updateMany(
            { recipient: req.session.user.loginId, isRead: false },
            { isRead: true }
        );
        req.flash('success_msg', 'All notifications have been marked as read.');
        res.redirect('/student/notifications');
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        req.flash('error_msg', 'An error occurred.');
        res.redirect('/student/notifications');
    }
};

exports.getSettingsPage = async (req, res) => {
    try {
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        res.render('student/settings', {
            title: 'Settings',
            user: req.session.user,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error("Error loading settings page:", error);
        req.flash('error_msg', 'Could not load settings.');
        res.redirect('/student/dashboard');
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (newPassword !== confirmPassword) {
            req.flash('error_msg', 'New passwords do not match.');
            return res.redirect('/student/settings');
        }

        const userLogin = await Login.findById(req.session.user.loginId);
        
        const isMatch = await bcrypt.compare(currentPassword, userLogin.password);
        if (!isMatch) {
            req.flash('error_msg', 'Incorrect current password.');
            return res.redirect('/student/settings');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        userLogin.password = hashedPassword;
        await userLogin.save();

        req.flash('success_msg', 'Password updated successfully.');
        res.redirect('/student/settings');
    } catch (error) {
        console.error("Error updating settings:", error);
        req.flash('error_msg', 'An error occurred while updating settings.');
        res.redirect('/student/settings');
    }
};

exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error_msg', 'No file selected.');
            return res.redirect('/student/settings');
        }
        
        await Student.findByIdAndUpdate(req.session.user.profileId, { profilePicture: req.file.path });
        
        if (req.session.user) {
            req.session.user.profilePicture = req.file.path;
        }

        req.flash('success_msg', 'Profile picture updated successfully.');
        res.redirect('/student/settings');
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        req.flash('error_msg', 'Failed to upload profile picture.');
        res.redirect('/student/settings');
    }
};