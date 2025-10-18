// helpers/taskHelper.js
exports.getTaskStatusInfo = (task, sprint) => {
    // Set 'today' to the very end of the current day for accurate comparison
    const today = new Date();
    today.setHours(23, 59, 59, 999); 

    if (!sprint) {
        return { text: 'No Sprint', color: '#858796' }; // Grey
    }
    
    const sprintEndDate = new Date(sprint.endDate);
    const daysRemaining = (sprintEndDate - today) / (1000 * 60 * 60 * 24);

    // 1. If the task is done, it's 'Completed'
    if (task.status === 'Done') {
        return { text: 'Completed', color: '#1cc88a' }; // Green
    }

    // 2. If the task was moved from a past sprint, it's 'Delayed'
    if (task.isMoved) {
        return { text: 'Delayed', color: '#e74a3b' }; // Red
    }

    // 3. If the sprint's end date has passed and the task isn't done, it's 'Delayed'
    if (daysRemaining < 0) {
        return { text: 'Delayed', color: '#e74a3b' }; // Red
    }

    // 4. If the sprint is ending soon and the task is not started, it's 'At Risk'
    if (daysRemaining < 2 && task.status === 'To-Do') {
        return { text: 'At Risk', color: '#f6c23e' }; // Orange/Yellow
    }

    // 5. Otherwise, the task is 'On Track'
    return { text: 'On Track', color: '#4e73df' }; // Blue
};