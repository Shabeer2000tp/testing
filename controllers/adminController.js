// 1. All imports are consolidated here at the top
const Login = require('../models/Login');
const Student = require('../models/Student');
const Guide = require('../models/Guide');
const Admin = require('../models/Admin');
const Team = require('../models/Team');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const BacklogItem = require('../models/BacklogItem');
const Proposal = require('../models/Proposal');
const DailyLog = require('../models/DailyLog');
const Deliverable = require('../models/Deliverable');
const Domain = require('../models/Domain');
const Setting = require('../models/Setting'); 
const { getTaskStatusInfo } = require('../helpers/taskHelper');
const moment = require('moment');
const Reminder = require('../models/Reminder');
const Review = require('../models/Review');
const { uploadAttachment } = require('../config/multer-config');

// --- USER MANAGEMENT & MAIN DASHBOARD ---
exports.getDashboard = async (req, res) => {
    try {
        const pendingUsers = await Login.find({ status: 'pending' }).populate('profileId');
        const totalTeams = await Team.countDocuments();
        const activeSprints = await Sprint.countDocuments({ status: 'Active' });
        const adminProfile = await Admin.findById(req.session.user.profileId);
        
        // --- ADD THIS LINE ---
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        // Compute project health: onTrack / atRisk / delayed
        const teams = await Team.find({});
    let projectsAtRisk = 0;
    let projectsOnTrack = 0;
    let projectsDelayed = 0;
    let projectsUnscheduled = 0;
        const now = new Date();
    // Thresholds: allow overrides via query params for quick tuning
    const riskThreshold = parseInt(req.query.riskThreshold, 10) || 6; // default 6 tasks
    const nearWindowDays = parseInt(req.query.nearWindowDays, 10) || 3; // default 3 days
    const NEAR_END_MS = nearWindowDays * 24 * 60 * 60 * 1000;

    const atRiskDetails = [];
    for (const team of teams) {
            // Find the most relevant sprint for the team
            let sprintQuery;
            if (sprintSetting && sprintSetting.value === 'team') {
                sprintQuery = { team: team._id };
            } else {
                sprintQuery = { team: { $exists: false } };
            }

            // pick the latest sprint for this team (or global)
            const lastSprint = await Sprint.findOne(sprintQuery).sort({ endDate: -1 });

            let tasks = [];
            if (lastSprint) {
                tasks = await Task.find({ team: team._id, sprint: lastSprint._id });
            }

            // If there's no sprint found, classify as Unscheduled (no sprint assigned)
            if (!lastSprint) {
                projectsUnscheduled += 1;
                continue;
            }

            // Compute simple metrics
            const incompleteTasks = tasks.filter(t => t.status !== 'Done').length;
            const sprintEnded = lastSprint.endDate && (new Date(lastSprint.endDate) < now);

            // Define at-risk tasks: not Done and either overdue or ending within the configured window
            const atRiskTasks = tasks.filter(t => t.status !== 'Done' && (new Date(t.endDate) < now || ((new Date(t.endDate) - now) <= NEAR_END_MS)));
            const atRiskCount = atRiskTasks.length;

            // Determine sprint near end
            const nearEnding = lastSprint.endDate && (new Date(lastSprint.endDate) >= now) && ((new Date(lastSprint.endDate) - now) <= NEAR_END_MS);

            // Prioritize delayed projects (sprint ended with incomplete work)
            if (sprintEnded && incompleteTasks > 0) {
                projectsDelayed += 1;
            } else if (atRiskCount >= riskThreshold || (nearEnding && atRiskCount > 0)) {
                // Use >= to include teams that meet the configured threshold
                projectsAtRisk += 1;
                // collect top 5 at-risk tasks for UI
                atRiskDetails.push({
                    teamName: team.name,
                    atRiskCount,
                    tasks: atRiskTasks.sort((a,b) => new Date(a.endDate) - new Date(b.endDate)).slice(0,5).map(t => ({
                        _id: t._id,
                        description: t.description,
                        status: t.status,
                        endDate: t.endDate,
                    }))
                });
            } else {
                projectsOnTrack += 1;
            }
        }

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            user: req.session.user,
            pendingUsers,
            totalTeams,
            activeSprints,
            adminName: adminProfile ? adminProfile.name : 'Admin',
            sprintSetting: sprintSetting || { value: 'global' },
            projectsAtRisk,
            projectsOnTrack,
            projectsDelayed,
            projectsUnscheduled,
            atRiskDetails,
            riskThreshold,
            nearWindowDays
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Failed to load dashboard.');
        res.redirect('/');
    }
};
exports.approveUser = async (req, res) => {
    try {
        await Login.findByIdAndUpdate(req.params.id, { status: 'approved' });
        req.flash('success_msg', 'User has been approved successfully.');
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Something went wrong while approving user.');
        res.redirect('/admin/dashboard');
    }
};
exports.rejectUser = async (req, res) => {
    try {
        await Login.findByIdAndUpdate(req.params.id, { status: 'rejected' });
        req.flash('success_msg', 'User has been rejected.');
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Something went wrong while rejecting user.');
        res.redirect('/admin/dashboard');
    }
};

// --- TEAM MANAGEMENT ---
exports.getCreateTeamPage = async (req, res) => {
    try {
        // 1. Find all student IDs that are already in a team
        const assignedStudents = await Team.find({}).select('students');
        const assignedStudentIds = assignedStudents.flatMap(team => team.students);

        // 2. Find all students whose ID is NOT IN the assigned list
        const availableStudents = await Student.find({ _id: { $nin: assignedStudentIds } });
        
        const guides = await Guide.find({});
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        res.render('admin/create-team', { 
            title: 'Create Team',
            user: req.session.user,
            students: availableStudents, // <-- Pass the filtered list
            guides,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error("Error loading create team page:", error);
        req.flash('error_msg', 'Failed to load the create team page.');
        res.redirect('/admin/dashboard');
    }
};
exports.postCreateTeam = async (req, res) => {
    try {
        const { name, students, guide } = req.body;

        if (!name || !students || !guide) {
            req.flash('error_msg', 'Please fill out all fields.');
            return res.redirect('/admin/teams/new');
        }
        const studentArray = Array.isArray(students) ? students : [students];

        // --- ADD THIS VALIDATION BLOCK ---
        // Check if any of the selected students are already in another team
        const existingTeamAssignment = await Team.findOne({ students: { $in: studentArray } });
        if (existingTeamAssignment) {
            req.flash('error_msg', 'One or more selected students are already assigned to another team.');
            return res.redirect('/admin/teams/new');
        }
        // --- END OF VALIDATION ---

        const existingTeamName = await Team.findOne({ name: name });
        if (existingTeamName) {
            req.flash('error_msg', 'A team with this name already exists.');
            return res.redirect('/admin/teams/new');
        }

        const newTeam = new Team({ name, students: studentArray, guide });
        await newTeam.save();
        
        req.flash('success_msg', 'Team created successfully!');
        res.redirect('/admin/teams');

    } catch (error) {
        console.error("Error creating team:", error);
        req.flash('error_msg', 'An error occurred while creating the team.');
        res.redirect('/admin/teams/new');
    }
};
exports.getTeamsListPage = async (req, res) => {
    try {
        const sortBy = req.query.sortBy || 'name'; // Default sort by name
        const search = req.query.search || '';

        let query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
        }

        const teams = await Team.find(query).populate('guide', 'name').populate('students', 'name studentIdNumber');
        const allSprints = await Sprint.find({});
        const overallTotalPoints = allSprints.reduce((sum, sprint) => sum + (sprint.capacity || 0), 0);

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        for (const team of teams) {
            let activeSprintForTeam;

            if (sprintSetting && sprintSetting.value === 'team') {
                activeSprintForTeam = await Sprint.findOne({
                    team: team._id,
                    startDate: { $lte: endOfToday },
                    endDate: { $gte: startOfToday },
                    status: { $in: ['Active', 'Pending'] }
                });
            } else {
                activeSprintForTeam = await Sprint.findOne({
                    team: { $exists: false },
                    startDate: { $lte: endOfToday },
                    endDate: { $gte: startOfToday },
                    status: { $in: ['Active', 'Pending'] }
                });
            }

            if (activeSprintForTeam) {
                const tasks = await Task.find({ team: team._id, sprint: activeSprintForTeam._id });
                // Use the sprint's total capacity for the progress bar total
                team.sprintCapacity = activeSprintForTeam.capacity;
                team.completedStoryPoints = tasks.filter(task => task.status === 'Done').reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                team.activeSprintName = activeSprintForTeam.name; // Add sprint name
            } else {
                // Mark team as unscheduled when no active sprint exists
                team.isUnscheduled = true;
            }

            const allCompletedTasks = await Task.find({ team: team._id, status: 'Done' });
            team.overallCompletedPoints = allCompletedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
            // --- ADD THIS BLOCK TO FETCH PROPOSAL DOMAIN ---
            const proposal = await Proposal.findOne({ team: team._id, status: 'Approved' }).populate('domain');
            team.projectTitle = proposal ? proposal.title : 'Untitled Project';
            team.domainName = proposal && proposal.domain ? proposal.domain.name : 'N/A';
            team.overallTotalPoints = overallTotalPoints;
        }

        // --- SORTING LOGIC ---
        teams.sort((a, b) => {
            if (sortBy === 'sprint_progress') {
                const progressA = a.sprintCapacity > 0 ? (a.completedStoryPoints / a.sprintCapacity) : -1;
                const progressB = b.sprintCapacity > 0 ? (b.completedStoryPoints / b.sprintCapacity) : -1;
                return progressB - progressA; // Highest progress first
            } else if (sortBy === 'overall_progress') {
                const progressA = a.overallTotalPoints > 0 ? (a.overallCompletedPoints / a.overallTotalPoints) : -1;
                const progressB = b.overallTotalPoints > 0 ? (b.overallCompletedPoints / b.overallTotalPoints) : -1;
                return progressB - progressA; // Highest progress first
            } else if (sortBy === 'domain') {
                return a.domainName.localeCompare(b.domainName);
            } else { // Default to 'name'
                return a.name.localeCompare(b.name);
            }
        });

        res.render('admin/teams-list', { 
            title: 'All Teams', 
            user: req.session.user,
            teams,
            sprintSetting: sprintSetting || { value: 'global' },
            sortBy, // Pass sortBy to the view
            search // Pass search term to the view
        });

    } catch (error) {
        console.error("Error loading teams list:", error);
        req.flash('error_msg', 'Failed to load teams list.');
        res.redirect('/admin/dashboard');
    }
};
exports.getTeamDetailPage = async (req, res) => {
    try {
        const teamId = req.params.id;
        const team = await Team.findById(teamId).populate('guide', 'name').populate('students', 'name studentIdNumber');
        if (!team) {
            req.flash('error_msg', 'Team not found.');
            return res.redirect(`/${req.session.user.role}/dashboard`);
        }

        // --- FIX: Fetch the approved proposal to get the project title ---
        const proposal = await Proposal.findOne({ team: team._id, status: 'Approved' }).populate('domain');
        team.projectTitle = proposal ? proposal.title : 'Not yet defined';
        team.domainName = proposal && proposal.domain ? proposal.domain.name : 'N/A';
        // --- End of fix ---

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // --- NEW: Calculate Overall Project Progress ---
        const teamSprints = await Sprint.find({ team: team._id });
        const overallTotalPoints = teamSprints.reduce((sum, sprint) => sum + (sprint.capacity || 0), 0);
        
        const allCompletedTasks = await Task.find({ team: team._id, status: 'Done' });
        const overallCompletedPoints = allCompletedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
        team.overallCompletedPoints = overallCompletedPoints;
        team.overallTotalPoints = overallTotalPoints;

        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        let activeSprint;

        if (sprintSetting && sprintSetting.value === 'team') {
            activeSprint = await Sprint.findOne({
                team: team._id,
                startDate: { $lte: endOfToday },
                endDate: { $gte: startOfToday },
                status: { $in: ['Active', 'Pending'] }
            });
        } else {
            activeSprint = await Sprint.findOne({
                team: { $exists: false },
                startDate: { $lte: endOfToday },
                endDate: { $gte: startOfToday },
                status: { $in: ['Active', 'Pending'] }
            });
        }

        // --- NEW: Fetch upcoming reviews for the team ---
        const upcomingReviews = await Review.find({ team: team._id, reviewDate: { $gte: new Date() } }).sort({ reviewDate: 'asc' }).limit(3);

        let dailyLogs = [], deliverables = [];
        if (activeSprint) {
            const tasks = await Task.find({ team: team._id, sprint: activeSprint._id }).populate('assignedTo', 'name');
            tasks.forEach(task => {
                task.realtimeStatus = getTaskStatusInfo(task, activeSprint);
            });
            team.tasks = tasks;

            // --- KEY CHANGE ---
            // Base all progress on the sprint's defined capacity
            team.sprintCapacity = activeSprint.capacity;
            team.completedStoryPoints = tasks.filter(task => task.status === 'Done').reduce((sum, task) => sum + (task.storyPoints || 0), 0);

            dailyLogs = await DailyLog.find({ team: team._id, sprint: activeSprint._id }).populate('student', 'name').sort({ createdAt: -1 });
            deliverables = await Deliverable.find({ team: team._id }).populate('uploadedBy', 'name').sort({ createdAt: -1 });
            
            // --- BURNDOWN CHART CORRECTION ---
            const sprintStartDate = new Date(activeSprint.startDate);
            const sprintEndDate = new Date(activeSprint.endDate);
            const labels = [], idealData = [], actualData = [];
            
            // Start the chart from the sprint's full capacity
            let remainingPoints = activeSprint.capacity; 
            const totalSprintDays = (sprintEndDate - sprintStartDate) / (1000 * 60 * 60 * 24) + 1;
            const idealBurnPerDay = activeSprint.capacity / (totalSprintDays > 0 ? totalSprintDays : 1);

            for (let d = new Date(sprintStartDate); d <= sprintEndDate; d.setDate(d.getDate() + 1)) {
                if (d > new Date()) break;
                labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                const daysPassed = (d - sprintStartDate) / (1000 * 60 * 60 * 24);
                idealData.push(Math.round(activeSprint.capacity - (daysPassed * idealBurnPerDay)));
                const pointsCompletedOnThisDay = tasks.filter(task => task.status === 'Done' && new Date(task.updatedAt).toDateString() === d.toDateString()).reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                remainingPoints -= pointsCompletedOnThisDay;
                actualData.push(remainingPoints);
            }
            team.burndownChartData = { labels: JSON.stringify(labels), actualData: JSON.stringify(actualData), idealData: JSON.stringify(idealData) };
        } else {
            // --- NEW: If no active sprint, fetch past sprints for context ---
            const pastSprints = await Sprint.find({ team: team._id, status: 'Completed' }).sort({ endDate: -1 }).limit(5);
            for(const sprint of pastSprints) {
                const tasks = await Task.find({ sprint: sprint._id, status: 'Done' });
                sprint.completed = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
            }
            team.pastSprints = pastSprints;
        }
        
        res.render('partials/team-detail', {
            title: `Team: ${team.name}`, 
            user: req.session.user,
            team, 
            activeSprint, 
            dailyLogs, 
            deliverables,
            upcomingReviews, // Pass the upcoming reviews to the view
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error("Error loading team details:", error);
        req.flash('error_msg', 'A server error occurred while loading team details.');
        res.redirect(`/${req.session.user.role}/dashboard`);
    }
};
exports.getEditTeamPage = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        const allStudents = await Student.find({});
        const allGuides = await Guide.find({});
const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        res.render('admin/edit-team', { title: 'Edit Team', team,user: req.session.user, allStudents, allGuides,
            sprintSetting: sprintSetting || { value: 'global' } });
    } catch (error) {
        req.flash('error_msg', 'Failed to load the edit page.');
        res.redirect('/admin/teams');
    }
};
exports.updateTeam = async (req, res) => {
    try {
        await Team.findByIdAndUpdate(req.params.id, req.body);
        req.flash('success_msg', 'Team updated successfully!');
        res.redirect('/admin/teams');
    } catch (error) {
        req.flash('error_msg', 'Failed to update team.');
        res.redirect('/admin/teams');
    }
};
exports.deleteTeam = async (req, res) => {
    try {
        await Team.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Team deleted successfully.');
        res.redirect('/admin/teams');
    } catch (error) {
        req.flash('error_msg', 'Failed to delete team.');
        res.redirect('/admin/teams');
    }
};

// --- PROPOSAL & BACKLOG MANAGEMENT ---
exports.getProposalsPage = async (req, res) => {
    try {
        const proposals = await Proposal.find({ status: 'Pending Admin Confirmation' }).populate({ path: 'team', populate: { path: 'guide' } }).populate('domain');
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        res.render('admin/proposals', {
            title: 'Review Proposals',
            user: req.session.user, // <-- Add this line
            sprintSetting: sprintSetting || { value: 'global' },
            proposals
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load proposals.');
        res.redirect('/admin/dashboard');
    }
};
exports.approveProposal = async (req, res) => {
    try {
        const { feedback } = req.body;
        await Proposal.findByIdAndUpdate(req.params.id, { status: 'Approved', adminFeedback: feedback });
        req.flash('success_msg', 'Proposal approved successfully.');
        res.redirect('/admin/proposals');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Failed to approve proposal.');
        res.redirect('/admin/proposals');
    }
};
exports.rejectProposal = async (req, res) => {
    try {
        const { feedback } = req.body;
        if (!feedback) {
            req.flash('error_msg', 'Feedback is required to reject a proposal.');
            return res.redirect('/admin/proposals');
        }
        await Proposal.findByIdAndUpdate(req.params.id, { status: 'Rejected', adminFeedback: feedback });
        req.flash('success_msg', 'Proposal rejected successfully.');
        res.redirect('/admin/proposals');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Failed to reject proposal.');
        res.redirect('/admin/proposals');
    }
};
exports.getTeamBacklog = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            req.flash('error_msg', 'Team not found.');
            return res.redirect('/admin/teams');
        }
        const backlogItems = await BacklogItem.find({ team: team._id });
        res.render('admin/view-backlog', { title: `Backlog: ${team.name}`, team, backlogItems });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load team backlog.');
        res.redirect('/admin/teams');
    }
};

// --- ANALYTICS & REPORTS ---
exports.getAnalyticsPage = async (req, res) => {
    try {
        const teams = await Team.find({});
        const sprints = await Sprint.find({}).sort({ startDate: 1 });
        
        let overallBurndownData = null;
        if (sprints.length > 0) {
            const projectStartDate = new Date(sprints[0].startDate);
            const today = new Date();
            const labels = [];
            for (let d = new Date(projectStartDate); d <= today; d.setDate(d.getDate() + 1)) {
                labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            }
            
            // --- REVERT TO INDIVIDUAL TEAM CALCULATION ---
            const datasets = await Promise.all(teams.map(async (team) => {
                const tasks = await Task.find({ team: team._id });
                const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                let remainingPoints = totalPoints;
                const dailyData = [];
                for (let d = new Date(projectStartDate); d <= today; d.setDate(d.getDate() + 1)) {
                    const pointsCompleted = tasks.filter(task => task.status === 'Done' && new Date(task.updatedAt).toDateString() === d.toDateString()).reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                    remainingPoints -= pointsCompleted;
                    dailyData.push(remainingPoints);
                }
                return { label: team.name, data: dailyData, fill: false };
            }));
            
            overallBurndownData = { 
                labels: JSON.stringify(labels), 
                datasets: JSON.stringify(datasets) 
            };
        }

        const completedSprints = sprints.filter(s => s.status === 'Completed');
        
        const velocityDatasets = await Promise.all(teams.map(async (team) => {
            const data = await Promise.all(completedSprints.map(async (sprint) => {
                const tasks = await Task.find({ team: team._id, sprint: sprint._id, status: 'Done' });
                return tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
            }));
            return {
                label: team.name,
                data: data,
                fill: false,
                tension: 0.1
            };
        }));

        const velocityData = {
            labels: completedSprints.map(s => s.name),
            datasets: velocityDatasets
        };
        
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        res.render('admin/analytics', { 
            title: 'Project Analytics',
            user: req.session.user,
            teams,
            velocityData: JSON.stringify(velocityData),
            overallBurndownData,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error("Error loading analytics page:", error);
        req.flash('error_msg', 'Could not load analytics page.');
        res.redirect('/admin/dashboard');
    }
};
exports.getEvaluationReport = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id).populate('guide students');
        if (!team) {
            req.flash('error_msg', 'Team not found.');
            return res.redirect('/admin/teams');
        }
        const proposal = await Proposal.findOne({ team: team._id }).populate('domain');
        const tasks = await Task.find({ team: team._id }).sort({ createdAt: 1 });
        const completedTasks = tasks.filter(t => t.status === 'Done');
        const totalPointsCompleted = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
        res.render('admin/report', { title: `Report: ${team.name}`, team, proposal, tasks, completedTasks, totalPointsCompleted, moment });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not generate report.');
        res.redirect('/admin/teams');
    }
};

// --- SETTINGS ---
exports.getSettingsPage = async (req, res) => {
    try {
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        
        res.render('admin/settings', {
            title: 'Settings',
            user: req.session.user, // <-- Add this line
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error("Error loading settings page:", error);
        req.flash('error_msg', 'Could not load settings page.');
        res.redirect('/admin/dashboard');
    }
};

exports.updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        await Setting.findOneAndUpdate({ key: key }, { value: value }, { upsert: true });
        req.flash('success_msg', 'Setting updated successfully.');
        res.redirect('/admin/settings');
    } catch (error) {
        console.error("Error updating setting:", error);
        req.flash('error_msg', 'An error occurred while saving the setting.');
        res.redirect('/admin/settings');
    }
};
exports.getRemindersPage = async (req, res) => {
    try {
        const reminders = await Reminder.find({}).sort({ date: 'desc' });
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        res.render('admin/manage-reminders', {
            title: 'Manage Reminders',
            user: req.session.user,
            reminders,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load reminders page.');
        res.redirect('/admin/dashboard');
    }
};

exports.postCreateReminder = async (req, res) => {
    try {
        const { title, date, targetRole } = req.body;
        if (!title || !date) {
            req.flash('error_msg', 'Please provide a title and a date.');
            return res.redirect('/admin/reminders');
        }
        await new Reminder({ title, date, targetRole }).save();
        req.flash('success_msg', 'Reminder added successfully.');
        res.redirect('/admin/reminders');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error adding reminder.');
        res.redirect('/admin/reminders');
    }
};

exports.postDeleteReminder = async (req, res) => {
    try {
        await Reminder.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Reminder deleted successfully.');
        res.redirect('/admin/reminders');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error deleting reminder.');
        res.redirect('/admin/reminders');
    }
};
exports.getReviewsPage = async (req, res) => {
    try {
        const reviews = await Review.find({}).populate('team', 'name').sort({ reviewDate: 'desc' });
        const teams = await Team.find({});
        const guides = await Guide.find({});
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        res.render('admin/manage-reviews', {
            title: 'Schedule Reviews',
            user: req.session.user,
            reviews,
            teams,
            guides,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load the review scheduling page.');
        res.redirect('/admin/dashboard');
    }
};

exports.postCreateReview = async (req, res) => {
    try {
        // The 'teams' from the form can be one ID or an array of IDs
        const { teams, reviewDate, panel } = req.body;

        if (!teams || !reviewDate || !panel) {
            req.flash('error_msg', 'Please select at least one team, a date, and panel members.');
            return res.redirect('/admin/reviews');
        }

        // Ensure 'teams' and 'panel' are always arrays
        const teamsArray = Array.isArray(teams) ? teams : [teams];
        const panelArray = Array.isArray(panel) ? panel : [panel];

        // Loop through each selected team ID and create a review for it
        for (const teamId of teamsArray) {
            await new Review({ 
                team: teamId, 
                reviewDate, 
                panel: panelArray 
            }).save();
        }

        req.flash('success_msg', `Review scheduled successfully for ${teamsArray.length} team(s).`);
        res.redirect('/admin/reviews');
    } catch (error) {
        console.error("Error creating review(s):", error);
        req.flash('error_msg', 'An error occurred while scheduling the review(s).');
        res.redirect('/admin/reviews');
    }
};

exports.postDeleteReview = async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Review has been deleted successfully.');
        res.redirect('/admin/reviews');
    } catch (error) {
        console.error("Error deleting review:", error);
        req.flash('error_msg', 'An error occurred while deleting the review.');
        res.redirect('/admin/reviews');
    }
};
exports.getReviewDetailPage = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate({
                path: 'team',
                populate: { path: 'students guide', select: 'name' } // Populate nested fields
            })
            .populate('panel', 'name'); // Populate the panel members' names

        if (!review) {
            req.flash('error_msg', 'Review not found.');
            return res.redirect('/admin/reviews');
        }

        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        res.render('admin/review-detail', {
            title: `Review Details: ${review.team.name}`,
            user: req.session.user,
            review,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error("Error loading review detail page:", error);
        req.flash('error_msg', 'Could not load the review details.');
        res.redirect('/admin/reviews');
    }
};

const Notification = require('../models/Notification');


// This function displays the "Send Notification" page
exports.getNotificationPage = async (req, res) => {
    try {
        const students = await Login.find({ role: 'student', status: 'approved' }).populate('profileId');
        const guides = await Login.find({ role: 'guide', status: 'approved' }).populate('profileId');
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        res.render('admin/send-notification', {
            title: 'Send Notification',
            user: req.session.user,
            students,
            guides,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load the notifications page.');
        res.redirect('/admin/dashboard');
    }
};

// This function will handle sending the notification (we'll complete it later)
exports.postSendNotification = async (req, res) => {
    // We will add the logic to save and emit the notification in a later step.
    // For now, this just confirms the form is working.
    req.flash('success_msg', 'Notification logic is pending.');
    res.redirect('/admin/notifications/new');
};

exports.getNotificationLogPage = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const search = req.query.search || '';
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 15; // Notifications per page
        const skip = (page - 1) * limit;

        let query = {};
        if (search) { 
            query = {
                $or: [
                    { message: { $regex: search, $options: 'i' } },
                    { senderName: { $regex: search, $options: 'i' } }
                ] 
            };
        }

        // Add date range filter if provided
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) // Include the whole end day
            };
        }

        const totalNotifications = await Notification.countDocuments(query); 
        const totalPages = Math.ceil(totalNotifications / limit);

        const notifications = await Notification.find(query)
            .populate({ path: 'recipient', select: 'email profileId', populate: { path: 'profileId', select: 'name' } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.render('admin/notification-log', {
            title: 'Notification Log',
            notifications,
            currentPage: page,
            totalPages,
            search,
            startDate,
            endDate
        });
    } catch (error) {
        console.error('Error loading notification log:', error);
        req.flash('error_msg', 'Could not load the notification log.');
        res.redirect('/admin/dashboard');
    }
};

exports.postResendNotification = async (req, res) => {
    try {
        const originalNotification = await Notification.findById(req.params.id);
        if (!originalNotification) {
            req.flash('error_msg', 'Original notification not found.');
            return res.redirect('/admin/notifications/log');
        }

        const newNotification = new Notification({
            recipient: originalNotification.recipient,
            senderName: req.session.user.name, // Set sender as current admin
            message: originalNotification.message,
            link: originalNotification.link,
            attachment: originalNotification.attachment
        });

        await newNotification.save();

        // Emit the real-time event to the specific user
        req.io.to(originalNotification.recipient.toString()).emit('new_notification', newNotification);

        req.flash('success_msg', 'Notification has been resent successfully.');
        res.redirect('/admin/notifications/log');
    } catch (error) {
        console.error('Error resending notification:', error);
        req.flash('error_msg', 'An error occurred while resending the notification.');
        res.redirect('/admin/notifications/log');
    }
};
exports.postSendNotification = async (req, res) => {
    try {
        const { recipients, message, link } = req.body;
        const recipientDetails = req.body['recipient-details'] ? JSON.parse(req.body['recipient-details']) : {};
        const senderName = req.session.user.name;

        if (!recipients || !message) {
            req.flash('error_msg', 'Please select recipients and enter a message.');
            return res.redirect('/admin/notifications/new');
        }

        let recipientIds = [];
        const recipientsArray = Array.isArray(recipients) ? recipients : [recipients];

        // Determine the final list of recipient IDs
        if (recipientsArray.includes('all_students')) {
            const students = await Login.find({ role: 'student' }, '_id');
            recipientIds.push(...students.map(s => s._id));
        }
        if (recipientsArray.includes('all_guides')) {
            const guides = await Login.find({ role: 'guide' }, '_id');
            recipientIds.push(...guides.map(g => g._id));
        }
        // Add individual user IDs
        const individualIds = recipientsArray.filter(id => !id.startsWith('all_'));
        recipientIds.push(...individualIds);

        // Remove duplicates
        const uniqueRecipientIds = [...new Set(recipientIds.map(id => id.toString()))];

        // Create and save a notification for each recipient
        for (const recipientId of uniqueRecipientIds) {
            let recipientDisplayName = 'System'; // Default

            // Find the display name for this recipient
            if (recipientDetails[recipientId]) {
                recipientDisplayName = recipientDetails[recipientId];
            } else if (recipientsArray.includes('all_students') && recipientsArray.includes('all_guides')) {
                recipientDisplayName = 'All Users';
            } else if (recipientsArray.includes('all_students')) {
                recipientDisplayName = 'All Students';
            } else if (recipientsArray.includes('all_guides')) {
                recipientDisplayName = 'All Guides';
            }

            const newNotification = new Notification({
                recipient: recipientId,
                senderName,
                message,
                link: link || '#',
                attachment: req.file ? { path: req.file.path, originalName: req.file.originalname } : undefined,
                recipientDisplayName // Store the determined display name
            });
            await newNotification.save();

            // EMIT the real-time event to the specific user
            req.io.to(recipientId).emit('new_notification', newNotification);
        }

        req.flash('success_msg', `Notification sent to ${uniqueRecipientIds.length} user(s).`);
        res.redirect('/admin/notifications/new');

    } catch (error) {
        console.error("Error sending notification:", error);
        req.flash('error_msg', 'An error occurred while sending the notification.');
        res.redirect('/admin/notifications/new');
    }
};
// Admin debug endpoint: returns per-team risk classification and metrics as JSON
exports.getRiskDebug = async (req, res) => {
    try {
        const teams = await Team.find({});
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        const riskThreshold = parseInt(req.query.riskThreshold, 10) || 6;
        const nearWindowDays = parseInt(req.query.nearWindowDays, 10) || 3;
        const NEAR_END_MS = nearWindowDays * 24 * 60 * 60 * 1000;
        const now = new Date();

        const details = [];
        for (const team of teams) {
            let sprintQuery;
            if (sprintSetting && sprintSetting.value === 'team') {
                sprintQuery = { team: team._id };
            } else {
                sprintQuery = { team: { $exists: false } };
            }
            const lastSprint = await Sprint.findOne(sprintQuery).sort({ endDate: -1 });
            let tasks = [];
            if (lastSprint) tasks = await Task.find({ team: team._id, sprint: lastSprint._id });

            if (!lastSprint) {
                details.push({ teamId: team._id, teamName: team.name, classification: 'unscheduled', reason: 'no sprint found' });
                continue;
            }

            const incompleteTasks = tasks.filter(t => t.status !== 'Done').length;
            const sprintEnded = lastSprint.endDate && (new Date(lastSprint.endDate) < now);
            const atRiskTasks = tasks.filter(t => t.status !== 'Done' && (new Date(t.endDate) < now || ((new Date(t.endDate) - now) <= NEAR_END_MS)));
            const atRiskCount = atRiskTasks.length;
            const nearEnding = lastSprint.endDate && (new Date(lastSprint.endDate) >= now) && ((new Date(lastSprint.endDate) - now) <= NEAR_END_MS);

            let classification = 'onTrack';
            let reason = '';
            if (sprintEnded && incompleteTasks > 0) {
                classification = 'delayed';
                reason = 'sprint ended with incomplete tasks';
            } else if (atRiskCount >= riskThreshold || (nearEnding && atRiskCount > 0)) {
                classification = 'atRisk';
                reason = `atRiskCount=${atRiskCount} nearEnding=${nearEnding}`;
            } else {
                classification = 'onTrack';
                reason = `incompleteTasks=${incompleteTasks}`;
            }

            details.push({
                teamId: team._id,
                teamName: team.name,
                lastSprint: lastSprint ? { id: lastSprint._id, startDate: lastSprint.startDate, endDate: lastSprint.endDate } : null,
                incompleteTasks,
                atRiskCount,
                nearEnding,
                sprintEnded,
                classification,
                reason
            });
        }

        res.json({ riskThreshold, nearWindowDays, now, details });
    } catch (error) {
        console.error('getRiskDebug error', error);
        res.status(500).json({ error: 'Failed to compute risk debug info' });
    }
};