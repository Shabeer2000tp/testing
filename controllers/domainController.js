const Domain = require('../models/Domain');
const Setting = require('../models/Setting'); 

exports.getDomainsPage = async (req, res) => {
    try {
        const domains = await Domain.find({});
        const sprintSetting = await Setting.findOne({ key: 'sprintCreation' });

        res.render('admin/manage-domains', {
            title: 'Manage Domains', // <-- Add this line
            user: req.session.user,
            sprintSetting: sprintSetting || { value: 'global' },
            domains
        });
    } catch (error) {
        console.error("Error loading domains page:", error);
        req.flash('error_msg', 'Could not load domains.');
        res.redirect('/admin/dashboard');
    }
};

exports.createDomain = async (req, res) => {
    try {
        const { name } = req.body;
        await new Domain({ name }).save();
        req.flash('success_msg', 'Domain added successfully.');
        res.redirect('/admin/domains');
    } catch (error) {
        req.flash('error_msg', 'Failed to add domain. It may already exist.');
        res.redirect('/admin/domains');
    }
};