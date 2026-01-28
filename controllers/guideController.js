// 1. All imports are consolidated here at the top
const Team = require('../models/Team');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const BacklogItem = require('../models/BacklogItem');
const Proposal = require('../models/Proposal');
const DailyLog = require('../models/DailyLog');
const Deliverable = require('../models/Deliverable');
const Setting = require('../models/Setting'); 
const { getTaskStatusInfo } = require('../helpers/taskHelper');

// --- DASHBOARD & TEAM VIEWS ---
exports.getDashboard = async (req, res) => {
    try {
        const guideId = req.session.user.profileId;
        const teams = await Team.find({ guide: guideId }).populate('guide', 'name').populate('students', 'name studentIdNumber');

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        const allSprints = await Sprint.find({});
        const overallTotalPoints = allSprints.reduce((sum, sprint) => sum + (sprint.capacity || 0), 0);

        let anySprintIsActive = false;

        for (const team of teams) {
            // Initialize properties
            team.sprintCapacity = 0;
            team.completedStoryPoints = 0;
            team.activeSprintName = 'None';

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
                anySprintIsActive = true;
                const tasks = await Task.find({ team: team._id, sprint: activeSprintForTeam._id });
                
                team.sprintCapacity = activeSprintForTeam.capacity;
                team.completedStoryPoints = tasks.filter(task => task.status === 'Done').reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                team.activeSprintName = activeSprintForTeam.name;
            }

            const allCompletedTasks = await Task.find({ team: team._id, status: 'Done' });
            team.overallCompletedPoints = allCompletedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
            team.overallTotalPoints = overallTotalPoints;

            const proposal = await Proposal.findOne({ team: team._id, status: 'Approved' }).populate('domain');
            team.projectTitle = proposal ? proposal.title : 'Untitled Project';
            team.domainName = proposal && proposal.domain ? proposal.domain.name : 'N/A';
        }

        res.render('guide/dashboard', {
            title: 'Guide Dashboard',
            user: req.session.user,
            teams,
            anySprintIsActive: anySprintIsActive,
            sprintSetting: sprintSetting || { value: 'global' }
        });
        
    } catch (error) {
        console.error("Error in guide dashboard:", error);
        req.flash('error_msg', 'Could not load dashboard.');
        res.redirect('/login');
    }
};
// exports.getTeamDetailPage = async (req, res) => {
//     try {
//         const teamId = req.params.id;
//         const guideId = req.session.user.profileId;
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);

//         const team = await Team.findOne({ _id: teamId, guide: guideId }).populate('guide students');
//         if (!team) {
//             req.flash('error_msg', 'Team not found or you are not authorized to view it.');
//             return res.redirect('/guide/dashboard');
//         }

//         let activeSprint;
//         const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

//         if (sprintSetting && sprintSetting.value === 'team') {
//             activeSprint = await Sprint.findOne({
//                 team: team._id,
//                 startDate: { $lte: today },
//                 endDate: { $gte: today }
//             });
//         } else {
//             activeSprint = await Sprint.findOne({
//                 startDate: { $lte: today },
//                 endDate: { $gte: today }
//             });
//         }
        
//         let dailyLogs = [], deliverables = [];
//         if (activeSprint) {
//             const tasks = await Task.find({ team: team._id, sprint: activeSprint._id }).populate('assignedTo', 'name');
//             tasks.forEach(task => {
//                 task.realtimeStatus = getTaskStatusInfo(task, activeSprint);
//             });
//             team.tasks = tasks;
//             team.totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
//             team.completedStoryPoints = tasks.filter(task => task.status === 'Done').reduce((sum, task) => sum + (task.storyPoints || 0), 0);
//             dailyLogs = await DailyLog.find({ team: team._id, sprint: activeSprint._id }).populate('student', 'name').sort({ createdAt: -1 });
//             deliverables = await Deliverable.find({ team: team._id }).populate('uploadedBy', 'name');
            
//             const sprintStartDate = new Date(activeSprint.startDate);
//             const sprintEndDate = new Date(activeSprint.endDate);
//             const labels = [], idealData = [], actualData = [];
//             let remainingPoints = team.totalStoryPoints;
//             const totalSprintDays = (sprintEndDate - sprintStartDate) / (1000 * 60 * 60 * 24) + 1;
//             const idealBurnPerDay = team.totalStoryPoints / (totalSprintDays > 0 ? totalSprintDays : 1);
//             for (let d = new Date(sprintStartDate); d <= sprintEndDate; d.setDate(d.getDate() + 1)) {
//                 if (d > new Date()) break;
//                 labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
//                 const daysPassed = (d - sprintStartDate) / (1000 * 60 * 60 * 24);
//                 idealData.push(Math.round(team.totalStoryPoints - (daysPassed * idealBurnPerDay)));
//                 const pointsCompletedOnThisDay = tasks.filter(task => task.status === 'Done' && new Date(task.updatedAt).toDateString() === d.toDateString()).reduce((sum, task) => sum + (task.storyPoints || 0), 0);
//                 remainingPoints -= pointsCompletedOnThisDay;
//                 actualData.push(remainingPoints);
//             }
//             team.burndownChartData = { labels: JSON.stringify(labels), actualData: JSON.stringify(actualData), idealData: JSON.stringify(idealData) };
//         }
//         res.render('guide/team-detail', { title: `Team: ${team.name}`, team, activeSprint, dailyLogs, deliverables });
//     } catch (error) {
//         console.error(error);
//         req.flash('error_msg', 'A server error occurred while loading team details.');
//         res.redirect('/guide/dashboard');
//     }
// };
exports.getTeamDetailPage = async (req, res) => {
    try {
        const teamId = req.params.id;
        const guideId = req.session.user.profileId;
        const team = await Team.findOne({ _id: teamId, guide: guideId }).populate('guide', 'name').populate('students', 'name studentIdNumber');
        
        if (!team) {
            req.flash('error_msg', 'Team not found or you are not authorized to view it.');
            return res.redirect('/guide/dashboard');
        }

        // --- FIX: Add project/domain name to team object for detail page ---
        const proposal = await Proposal.findOne({ team: team._id, status: 'Approved' }).populate('domain');
        team.domainName = proposal && proposal.domain ? proposal.domain.name : 'N/A';

        // --- FIX: Calculate Overall Project Progress correctly for this team ---
        const teamSprints = await Sprint.find({ team: team._id });
        const overallTotalPoints = teamSprints.reduce((sum, sprint) => sum + (sprint.capacity || 0), 0);
        const allCompletedTasks = await Task.find({ team: team._id, status: 'Done' });
        const overallCompletedPoints = allCompletedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
        team.overallCompletedPoints = overallCompletedPoints;
        team.overallTotalPoints = overallTotalPoints;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

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
            
            // Calculate the realtimeStatus for each task
            tasks.forEach(task => {
                task.realtimeStatus = getTaskStatusInfo(task, activeSprint);
            });
            team.tasks = tasks;

            // Base all progress on the sprint's defined capacity
            team.sprintCapacity = activeSprint.capacity;
            team.completedStoryPoints = tasks.filter(task => task.status === 'Done').reduce((sum, task) => sum + (task.storyPoints || 0), 0);

            dailyLogs = await DailyLog.find({ team: team._id, sprint: activeSprint._id }).populate('student', 'name').sort({ createdAt: -1 });
            deliverables = await Deliverable.find({ team: team._id }).populate('uploadedBy', 'name').sort({ createdAt: -1 });
            
            // Burndown chart calculation
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
                    const pointsCompletedOnThisDay = tasks.filter(task => task.status === 'Done' && new Date(task.updatedAt).toDateString() === d.toDateString()).reduce((sum, task) => sum + (task.storyPoints || 0), 0);
                    remainingPoints -= pointsCompletedOnThisDay;
                    actualData.push(remainingPoints);
                }
            }
            team.burndownChartData = { labels: labels, actualData: actualData, idealData: idealData };
        }
        
        res.render('guide/team-detail', { 
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
        res.redirect('/guide/dashboard');
    }
};
// --- PROPOSAL & LOG MANAGEMENT ---
exports.getTeamBacklog = async (req, res) => {
    try {
        const team = await Team.findOne({ _id: req.params.id, guide: req.session.user.profileId }).populate('students');
        if (!team) {
            req.flash('error_msg', 'Team not found or you are not assigned to it.');
            return res.redirect('/guide/dashboard');
        }
        const backlogItems = await BacklogItem.find({ team: team._id });
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        // Sync Backlog Item status with Task status
        // If an item is 'In Sprint' but the corresponding task is 'Done', mark item as 'Completed'
        const teamTasks = await Task.find({ team: team._id });
        for (const item of backlogItems) {
            if (item.status === 'In Sprint') {
                // Find a task with the same description that is Done
                const completedTask = teamTasks.find(t => t.description === item.description && t.status === 'Done');
                if (completedTask) {
                    item.status = 'Completed';
                    await item.save();
                }
            }
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

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

        res.render('guide/view-backlog', { 
            title: `Backlog: ${team.name}`, 
            team, 
            backlogItems,
            user: req.session.user,
            sprintSetting: sprintSetting || { value: 'global' },
            activeSprint
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load team backlog.');
        res.redirect('/guide/dashboard');
    }
};

exports.postCreateBacklogItem = async (req, res) => {
    try {
        const { description, priority } = req.body;
        const teamId = req.params.id;

        if (!description || !priority) {
            req.flash('error_msg', 'Please provide a description and priority.');
            return res.redirect(`/guide/teams/${teamId}/backlog`);
        }

        const newItem = new BacklogItem({ description, priority, team: teamId, status: 'New' });
        await newItem.save();

        req.flash('success_msg', 'Backlog item added successfully.');
        res.redirect(`/guide/teams/${teamId}/backlog`);
    } catch (error) {
        console.error("Error creating backlog item:", error);
        req.flash('error_msg', 'Failed to add backlog item.');
        res.redirect(`/guide/teams/${req.params.id}/backlog`);
    }
};

exports.postCreateBacklogItemAndSprintTask = async (req, res) => {
    try {
        const { description, priority, storyPoints, assignedTo, startDate, endDate, sprintId, assignedToAll } = req.body;
        const teamId = req.params.id;

        // 1. Create Backlog Item
        const newItem = new BacklogItem({ 
            description, 
            priority, 
            team: teamId, 
            status: 'In Sprint' 
        });
        await newItem.save();

        // 2. Create Task
        const newTaskData = {
            description,
            storyPoints: parseInt(storyPoints, 10),
            sprint: sprintId,
            team: teamId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: 'To-Do'
        };

        if (assignedToAll === 'on') {
            newTaskData.assignedToAll = true;
        } else {
            newTaskData.assignedTo = assignedTo;
        }
        
        await new Task(newTaskData).save();

        req.flash('success_msg', 'Item created and added to sprint successfully.');
        res.redirect(`/guide/teams/${teamId}/backlog`);
    } catch (error) {
        console.error("Error creating item and task:", error);
        req.flash('error_msg', 'Failed to create item and task.');
        res.redirect(`/guide/teams/${req.params.id}/backlog`);
    }
};

exports.postEditBacklogItem = async (req, res) => {
    try {
        const { description, priority } = req.body;
        await BacklogItem.findByIdAndUpdate(req.params.itemId, { description, priority });
        req.flash('success_msg', 'Backlog item updated.');
        res.redirect(`/guide/teams/${req.params.id}/backlog`);
    } catch (error) {
        console.error("Error updating backlog item:", error);
        req.flash('error_msg', 'Failed to update backlog item.');
        res.redirect(`/guide/teams/${req.params.id}/backlog`);
    }
};

exports.postDeleteBacklogItem = async (req, res) => {
    try {
        await BacklogItem.findByIdAndDelete(req.params.itemId);
        req.flash('success_msg', 'Backlog item deleted.');
        res.redirect(`/guide/teams/${req.params.id}/backlog`);
    } catch (error) {
        console.error("Error deleting backlog item:", error);
        req.flash('error_msg', 'Failed to delete backlog item.');
        res.redirect(`/guide/teams/${req.params.id}/backlog`);
    }
};

exports.getProposalsPage = async (req, res) => {
    try {
        const teams = await Team.find({ guide: req.session.user.profileId });
        const teamIds = teams.map(t => t._id);
        const proposals = await Proposal.find({ team: { $in: teamIds }, status: 'Pending Guide Approval' }).populate('team domain');
        res.render('guide/proposals', { title: 'Review Proposals', proposals });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load proposals.');
        res.redirect('/guide/dashboard');
    }
};
exports.approveProposal = async (req, res) => {
    try {
        const { feedback } = req.body;
        await Proposal.findByIdAndUpdate(req.params.id, { status: 'Pending Admin Confirmation', guideFeedback: feedback });
        req.flash('success_msg', 'Proposal approved and sent to admin for final confirmation.');
        res.redirect('/guide/proposals');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Failed to approve proposal.');
        res.redirect('/guide/proposals');
    }
};
exports.rejectProposal = async (req, res) => {
    try {
        const { feedback } = req.body;
        if (!feedback) {
            req.flash('error_msg', 'Feedback is required to reject a proposal.');
            return res.redirect('/guide/proposals');
        }
        await Proposal.findByIdAndUpdate(req.params.id, { status: 'Rejected', guideFeedback: feedback });
        req.flash('success_msg', 'Proposal has been rejected.');
        res.redirect('/guide/proposals');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Something went wrong.');
        res.redirect('/guide/proposals');
    }
};
exports.addLogFeedback = async (req, res) => {
    try {
        const { feedback } = req.body;
        await DailyLog.findByIdAndUpdate(req.params.id, { guideFeedback: feedback });
        req.flash('success_msg', 'Feedback added to the daily log.');
        res.redirect('back');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Failed to add feedback.');
        res.redirect('back');
    }
};
// Add Reminder to the top of your controller imports if not already there
const mongoose = require('mongoose');
const Reminder = require('../models/Reminder');
const Notification = require('../models/Notification');

// This function displays the list of notifications for the guide
exports.getNotificationsPage = async (req, res) => {
    try {
        // Use the guide's loginId to fetch their notifications
        const notifications = await Notification.find({ recipient: req.session.user.loginId })
            .sort({ createdAt: -1 });

        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        res.render('guide/notifications', {
            title: 'My Notifications',
            user: req.session.user,
            notifications,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error('Error loading notifications page:', error);
        req.flash('error_msg', 'Could not load your notifications.');
        res.redirect('/guide/dashboard');
    }
};

// This function displays the notification detail page
exports.getNotificationDetailPage = async (req, res) => {
    try {
        const id = req.params.id;

        // Validate incoming id to avoid Mongoose CastError
        if (!mongoose.Types.ObjectId.isValid(id)) {
            req.flash('error_msg', 'Invalid notification id.');
            return res.redirect('/guide/notifications');
        }

        const notification = await Notification.findOne({
            _id: id,
            recipient: req.session.user.loginId
        });

        if (!notification) {
            req.flash('error_msg', 'Notification not found.');
            return res.redirect('/guide/notifications');
        }

        if (!notification.isRead) {
            notification.isRead = true;
            await notification.save();
        }

        // Render the notification detail page
        return res.render('guide/notification-detail', {
            title: 'Notification Detail',
            user: req.session.user,
            notification,
            sprintSetting: await Setting.findOne({ key: 'sprintCreation' }) || { value: 'global' }
        });
    } catch (error) {
        console.error('Error in guideController.getNotificationDetailPage:', error);
        req.flash('error_msg', 'Could not load the notification detail.');
        return res.redirect('/guide/notifications');
    }
};

// This function marks a notification as read via AJAX
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

// This function handles the "Mark all as read" button
exports.postMarkAllRead = async (req, res) => {
    try {
       await Notification.updateMany(
            { recipient: req.session.user.loginId, isRead: false },
            { isRead: true }
        );
        req.flash('success_msg', 'All notifications have been marked as read.');
        res.redirect('/guide/notifications');
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        req.flash('error_msg', 'An error occurred.');
        res.redirect('/guide/notifications');
    }
};

exports.getCalendarPage = async (req, res) => {
    try {
        const guideId = req.session.user.profileId;
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        
        let calendarEvents = [];

        // 1. Fetch reminders visible to guides
        const reminders = await Reminder.find({ targetRole: { $in: ['all', 'guide'] } });
        reminders.forEach(reminder => {
            calendarEvents.push({
                title: reminder.title,
                start: reminder.date,
                allDay: true,
                backgroundColor: '#e74a3b', // Red for admin reminders
                borderColor: '#e74a3b'
            });
        });

        // 2. Fetch all teams managed by this guide
        const teams = await Team.find({ guide: guideId });
        const teamIds = teams.map(team => team._id);

        // 3. Fetch all sprints for those teams
        if (teamIds.length > 0) {
            const teamSprints = await Sprint.find({ team: { $in: teamIds } });
            teamSprints.forEach(sprint => {
                calendarEvents.push({
                    title: `${sprint.name} (${teams.find(t => t._id.equals(sprint.team)).name})`,
                    start: sprint.startDate,
                    end: new Date(new Date(sprint.endDate).setDate(sprint.endDate.getDate() + 1)),
                    backgroundColor: '#4e73df', // Blue for sprints
                    borderColor: '#4e73df'
                });
            });
        }
        
        res.render('guide/calendar', {
            title: 'Team Calendar',
            user: req.session.user,
            sprintSetting: sprintSetting || { value: 'global' },
            calendarEvents
        });

    } catch (error) {
        console.error("Error loading guide calendar page:", error);
        req.flash('error_msg', 'Could not load the calendar.');
        res.redirect('/guide/dashboard');
    }
};
const Review = require('../models/Review'); // Add this import at the top

exports.getReviewsPage = async (req, res) => {
    try {
        const guideId = req.session.user.profileId;

        // Find all reviews where this guide is in the 'panel' array
        const reviews = await Review.find({ panel: guideId })
            .populate('team', 'name') // Keep team name
            .populate('remarks.reviewer', '_id') // <-- Add this to check remark status
            .sort({ reviewDate: 'desc' });

        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        res.render('guide/my-reviews', {
            title: 'My Reviews',
            user: req.session.user,
            reviews,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load your assigned reviews.');
        res.redirect('/guide/dashboard');
    }
};
// This function displays the page
exports.getReviewDetailPage = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate({
                path: 'team',
                populate: { path: 'students guide', select: 'name' }
            })
            .populate('panel', 'name')
            .populate('remarks.reviewer', 'name'); // Populate the name of who made each remark

        if (!review) {
            req.flash('error_msg', 'Review not found.');
            return res.redirect('/guide/reviews');
        }

        // Check if the current guide is actually on the panel
        const isPanelMember = review.panel.some(member => member._id.equals(req.session.user.profileId));
        if (!isPanelMember) {
            req.flash('error_msg', 'You are not authorized to view this review.');
            return res.redirect('/guide/dashboard');
        }

        // --- NEW: Fetch related project data for context ---
        // Fetch the team's backlog items
        const backlogItems = await BacklogItem.find({ team: review.team._id }).sort({ priority: -1 });
        // Fetch the team's uploaded deliverables
        const deliverables = await Deliverable.find({ team: review.team._id }).populate('uploadedBy', 'name').sort({ createdAt: -1 });

        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        res.render('guide/review-detail', {
            title: `Review: ${review.team.name}`,
            user: req.session.user,
            review,
            sprintSetting: sprintSetting || { value: 'global' },
            backlogItems, // Pass backlog to the view
            deliverables  // Pass deliverables to the view
        });
    } catch (error) {
        console.error("Error loading review detail page:", error);
        req.flash('error_msg', 'Could not load review details.');
        res.redirect('/guide/reviews');
    }
};

// This function handles the form submission
exports.postAddRemark = async (req, res) => {
    try {
        const { suggestions, remarks } = req.body;
        const reviewId = req.params.id;
        const reviewerId = req.session.user.profileId;

        if (!suggestions && !remarks) {
            req.flash('error_msg', 'Please provide either suggestions or remarks.');
            return res.redirect(`/guide/reviews/${reviewId}`);
        }

        const review = await Review.findById(reviewId);
        
        // Check if this reviewer has already submitted a remark
        const existingRemark = review.remarks.find(r => r.reviewer.equals(reviewerId));
        if (existingRemark) {
            req.flash('error_msg', 'You have already submitted your remarks for this review.');
            return res.redirect(`/guide/reviews/${reviewId}`);
        }

        // Add the new remark to the array
        review.remarks.push({
            reviewer: reviewerId,
            suggestions,
            remarks
        });

        await review.save();
        req.flash('success_msg', 'Your remarks have been submitted successfully.');
        res.redirect(`/guide/reviews/${reviewId}`);
    } catch (error) {
        console.error("Error adding remark:", error);
        req.flash('error_msg', 'An error occurred while submitting your remarks.');
        res.redirect(`/guide/reviews/${req.params.id}`);
    }
};

exports.setTaskPermission = async (req, res) => {
    try {
        const { permission, taskMaster } = req.body;
        const teamId = req.params.id;
        const guideId = req.session.user.profileId;

        const team = await Team.findOne({ _id: teamId, guide: guideId });

        if (!team) {
            req.flash('error_msg', 'Team not found or you are not authorized.');
            return res.redirect('/guide/dashboard');
        }

        team.taskAssignmentPermission = permission;
        if (permission === 'guide-and-designated-student') {
            team.taskMaster = taskMaster;
        } else {
            team.taskMaster = undefined;
        }

        await team.save();

        req.flash('success_msg', 'Task assignment permissions updated successfully.');
        res.redirect(`/guide/teams/${teamId}`);
    } catch (error) {
        console.error("Error setting task permission:", error);
        req.flash('error_msg', 'An error occurred while updating permissions.');
        res.redirect('/guide/dashboard');
    }
};

exports.postCreateSprint = async (req, res) => {
    try {
        const { name, startDate, endDate, capacity, goal } = req.body;
        const teamId = req.params.id;

        if (!name || !startDate || !endDate || !capacity || !goal) {
            req.flash('error_msg', 'Please fill in all fields.');
            return res.redirect(`/guide/teams/${teamId}`);
        }

        // Check for existing active sprint to prevent duplicates
        const existingSprint = await Sprint.findOne({ 
            team: teamId, 
            status: { $in: ['Active', 'Pending'] } 
        });
        if (existingSprint) {
            req.flash('error_msg', 'There is already an active or pending sprint for this team.');
            return res.redirect(`/guide/teams/${teamId}`);
        }

        const newSprint = new Sprint({
            name,
            startDate,
            endDate,
            capacity: parseInt(capacity, 10),
            team: teamId,
            goal,
            status: 'Active' // Guide created sprints are Active by default
        });

        await newSprint.save();
        req.flash('success_msg', 'Sprint created successfully.');
        res.redirect(`/guide/teams/${teamId}`);
    } catch (error) {
        console.error("Error creating sprint:", error);
        req.flash('error_msg', 'Failed to create sprint.');
        res.redirect(`/guide/teams/${req.params.id}`);
    }
};

exports.postCreateTask = async (req, res) => {
    try {
        const { description, storyPoints, assignedTo, startDate, endDate, sprintId, assignedToAll, backlogItemId } = req.body;
        const teamId = req.params.id;

        const newTaskData = {
            description,
            storyPoints: parseInt(storyPoints, 10),
            sprint: sprintId,
            team: teamId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: 'To-Do'
        };

        if (assignedToAll === 'on') {
            newTaskData.assignedToAll = true;
            // Logic to assign to all could be handled here or by creating a task marked 'assignedToAll'
            // For simplicity, we create one task record marked as assignedToAll
            await new Task(newTaskData).save();
        } else {
            newTaskData.assignedTo = assignedTo;
            await new Task(newTaskData).save();
        }

        if (backlogItemId) {
            await BacklogItem.findByIdAndUpdate(backlogItemId, { status: 'In Sprint' });
        }

        req.flash('success_msg', 'Task assigned successfully.');
        res.redirect(`/guide/teams/${teamId}`);
    } catch (error) {
        console.error("Error creating task:", error);
        req.flash('error_msg', 'Failed to assign task.');
        res.redirect(`/guide/teams/${req.params.id}`);
    }
};

exports.postEditTask = async (req, res) => {
    try {
        const { description, storyPoints, status } = req.body;
        await Task.findByIdAndUpdate(req.params.taskId, { description, storyPoints, status });
        req.flash('success_msg', 'Task updated.');
        res.redirect('back');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Failed to update task.');
        res.redirect('back');
    }
};

exports.postDeleteTask = async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Task deleted successfully.');
        res.redirect('back');
    } catch (error) {
        console.error("Error deleting task:", error);
        req.flash('error_msg', 'Failed to delete task.');
        res.redirect('back');
    }
};

exports.getSprintsPage = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            req.flash('error_msg', 'Team not found.');
            return res.redirect('/guide/dashboard');
        }
        
        const sprints = await Sprint.find({ team: team._id }).sort({ startDate: -1 });
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        res.render('guide/manage-sprints', {
            title: `Manage Sprints - ${team.name}`,
            user: req.session.user,
            team,
            sprints,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error("Error loading sprints page:", error);
        req.flash('error_msg', 'Could not load sprints.');
        res.redirect(`/guide/teams/${req.params.id}`);
    }
};

exports.postEditSprint = async (req, res) => {
    try {
        const { name, startDate, endDate, capacity, goal, status } = req.body;
        await Sprint.findByIdAndUpdate(req.params.sprintId, {
            name, startDate, endDate, capacity, goal, status
        });
        req.flash('success_msg', 'Sprint updated successfully.');
        res.redirect('back');
    } catch (error) {
        console.error("Error updating sprint:", error);
        req.flash('error_msg', 'Failed to update sprint.');
        res.redirect('back');
    }
};

exports.postDeleteSprint = async (req, res) => {
    try {
        await Sprint.findByIdAndDelete(req.params.sprintId);
        req.flash('success_msg', 'Sprint deleted successfully.');
        res.redirect('back');
    } catch (error) {
        console.error("Error deleting sprint:", error);
        req.flash('error_msg', 'Failed to delete sprint.');
        res.redirect('back');
    }
};