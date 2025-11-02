
const bcrypt = require('bcryptjs');
const Login = require('../models/Login');
const Student = require('../models/Student');
const Guide = require('../models/Guide');
const Admin = require('../models/Admin'); // <-- Add this line

exports.getLandingPage = (req, res) => {
    if (req.session.isLoggedIn) {
        return res.redirect(`/${req.session.user.role}/dashboard`);
    }
    res.render('landing', { title: 'Welcome', layout: false });
};

// --- LOGIN ---
exports.getLogin = (req, res) => {
    if (req.session.isLoggedIn) {
        return res.redirect(`/${req.session.user.role}/dashboard`);
    }
    res.render('login', { title: 'Login', layout: 'partials/_auth-layout', pageType: 'two-column' });
};

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userLogin = await Login.findOne({ email });

        if (!userLogin) {
            req.flash('error_msg', 'Invalid email or password.');
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, userLogin.password);
        if (!isMatch) {
            req.flash('error_msg', 'Invalid email or password.');
            return res.redirect('/login');
        }

        if (userLogin.status !== 'approved') {
            if (userLogin.status === 'pending') {
                req.flash('error_msg', 'Your account is still pending admin approval.');
            } else {
                req.flash('error_msg', 'Your account has been rejected or is inactive.');
            }
            return res.redirect('/login');
        }
             
        // --- ADDED THIS BLOCK TO FETCH PROFILE NAME ---
        let profile;
        switch (userLogin.role) {
            case 'admin':
                profile = await Admin.findById(userLogin.profileId);
                break;
            case 'student':
                profile = await Student.findById(userLogin.profileId);
                break;
            case 'guide':
                profile = await Guide.findById(userLogin.profileId);
                break;
        }

        if (!profile) {
            req.flash('error_msg', 'Could not find an associated user profile.');
            return res.redirect('/login');
        }
        // --- END OF ADDED BLOCK ---


       req.session.isLoggedIn = true;
        req.session.user = {
            loginId: userLogin._id,
            id: userLogin.profileId, // <-- Use the correct profile ID
            role: userLogin.role,
            profileId: userLogin.profileId,
           name: profile.name // <-- Name is now included in the session
        };
        
        req.flash('success_msg', 'You are now logged in.');
        
        // Redirect based on role
        if (userLogin.role === 'admin') {
            return res.redirect('/admin/dashboard');
        } else if (userLogin.role === 'student') {
            return res.redirect('/student/dashboard');
        } else if (userLogin.role === 'guide') {
            return res.redirect('/guide/dashboard');
        }

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'A server error occurred.');
        res.redirect('/login');
    }
};

// --- REGISTRATION ---
exports.getRegister = (req, res) => {
    res.render('register', { 
        title: 'Register', 
        layout: 'partials/_auth-layout',
        pageType: 'single-column' // Pass type to layout
    });
};

exports.postRegister = async (req, res) => {
    try {
        const { name, email, password, role, studentIdNumber, department } = req.body;

        const existingLogin = await Login.findOne({ email });
        if (existingLogin) {
            req.flash('error_msg', 'A user with that email already exists.');
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        let userProfile;
        let profileModelName;

        if (role === 'student') {
            userProfile = new Student({ name, studentIdNumber });
            profileModelName = 'Student';
        } else if (role === 'guide') {
            userProfile = new Guide({ name, department });
            profileModelName = 'Guide';
        } else {
            req.flash('error_msg', 'An invalid role was selected.');
            return res.redirect('/register');
        }

        await userProfile.save();

        const newLogin = new Login({
            email,
            password: hashedPassword,
            role,
            profileId: userProfile._id,
            roleRef: profileModelName
        });
        await newLogin.save();

        req.flash('success_msg', 'Registration successful! Your account is now pending admin approval.');
        res.redirect('/');

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Something went wrong during registration.');
        res.redirect('/register');
    }
};

// --- LOGOUT ---
exports.postLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
};