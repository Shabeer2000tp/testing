const Sprint = require('../models/Sprint');
const Team = require('../models/Team');
const Task = require('../models/Task');
const Setting = require('../models/Setting'); // Import Setting model

/**
 * Display the sprint management page.
 * It intelligently fetches global sprints or team-specific sprints
 * based on the application setting.
 */
exports.getSprintsPage = async (req, res) => {
    try {
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        let sprints = [];
        let teamsWithSprints = [];

        if (sprintSetting && sprintSetting.value === 'team') {
            // In team mode, find sprints created by students and group them by team
            const teamSprints = await Sprint.find({ team: { $exists: true, $ne: null } })
                .populate('team', 'name')
                .sort({ startDate: -1 });

            // Group sprints by team for the view
            const groupedByTeam = teamSprints.reduce((acc, sprint) => {
                const teamId = sprint.team._id.toString();
                if (!acc[teamId]) {
                    acc[teamId] = {
                        name: sprint.team.name,
                        sprints: []
                    };
                }
                acc[teamId].sprints.push(sprint);
                return acc;
            }, {});
            teamsWithSprints = Object.values(groupedByTeam);

        } else {
            // In global mode, find only the sprints created by the admin (no team field)
            sprints = await Sprint.find({ team: { $exists: false } }).sort({ startDate: -1 });
        }
         

        res.render('admin/manage-sprints', {
            title: 'Manage Sprints',
             user: req.session.user,
            sprints,
            teamsWithSprints,
            sprintSetting: sprintSetting || { value: 'global' }
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Could not load sprints page.');
        res.redirect('/admin/dashboard');
    }
};

/**
 * Handle creation of a new GLOBAL sprint by an admin.
 */
exports.createSprint = async (req, res) => {
    try {
        const { name, goal, startDate, endDate, capacity } = req.body;
        // Creates a sprint with no 'team' field, marking it as global
        const newSprint = new Sprint({ name, goal, startDate, endDate, capacity });
        await newSprint.save();
        req.flash('success_msg', 'Global sprint created successfully!');
        res.redirect('/admin/sprints');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'An error occurred creating the sprint.');
        res.redirect('/admin/sprints');
    }
};

/**
 * Display the page for editing a sprint.
 */
exports.getEditSprintPage = async (req, res) => {
    try {
        const sprint = await Sprint.findById(req.params.id);
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });
        res.render('admin/edit-sprint', { title: `Edit: ${sprint.name}`,
             user: req.session.user,
              sprint, sprintSetting: sprintSetting || { value: 'global' } 
             });
    } catch (error) {
        req.flash('error_msg', 'Could not load sprint edit page.');
        res.redirect('/admin/sprints');
    }
};

/**
 * Handle the update of a sprint.
 */
exports.updateSprint = async (req, res) => {
    try {
        await Sprint.findByIdAndUpdate(req.params.id, req.body);
        req.flash('success_msg', 'Sprint updated successfully.');
        res.redirect('/admin/sprints');
    } catch (error) {
        req.flash('error_msg', 'Failed to update sprint.');
        res.redirect('/admin/sprints');
    }
};

/**
 * Handle the deletion of a sprint.
 */
exports.deleteSprint = async (req, res) => {
    try {
        await Sprint.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Sprint deleted successfully.');
        res.redirect('/admin/sprints');
    } catch (error) {
        req.flash('error_msg', 'Failed to delete sprint.');
        res.redirect('/admin/sprints');
    }
};

/**
 * Mark a sprint as 'Completed' and record velocity for all teams.
 */
exports.completeSprint = async (req, res) => {
    try {
        const sprintId = req.params.id;
        const sprint = await Sprint.findById(sprintId);
        
        const allTeams = await Team.find({});

        for (const team of allTeams) {
            const tasks = await Task.find({ 
                team: team._id, 
                sprint: sprintId, 
                status: 'Done' 
            });
            const completedPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
            
            // Add the result to the team's velocity history
            team.velocityHistory.push({
                sprintName: sprint.name,
                completedPoints: completedPoints
            });
            await team.save();
        }

        await Sprint.findByIdAndUpdate(sprintId, { status: 'Completed' });

        req.flash('success_msg', `Sprint "${sprint.name}" has been completed and velocities recorded!`);
        res.redirect('/admin/sprints');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Failed to complete the sprint.');
        res.redirect('/admin/sprints');
    }
};