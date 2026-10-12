import User from "../models/User.js";

// @desc    Get all users (except current user)
// @route   GET /api/users
// @access  Private
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user._id } }).select(
            "-password"
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search users by name or username
// @route   GET /api/users/search?q=ali
// @access  Private
export const searchUsers = async (req, res) => {
    try {
        const keyword = req.query.q
            ? {
                $or: [
                    { name: { $regex: req.query.q, $options: "i" } },
                    { username: { $regex: req.query.q, $options: "i" } },
                ],
            }
            : {};

        const users = await User.find(keyword)
            .find({ _id: { $ne: req.user._id } })
            .select("-password");

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/users/profile/me
// @access  Private
export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if username is being changed and if it's already taken
        if (req.body.username && req.body.username !== user.username) {
            const existingUser = await User.findOne({
                username: req.body.username.toLowerCase(),
                _id: { $ne: user._id },
            });
            if (existingUser) {
                return res.status(400).json({ message: "Username already taken" });
            }
            user.username = req.body.username.toLowerCase();
        }

        // Check if email is being changed and if it's already taken
        if (req.body.email && req.body.email !== user.email) {
            const existingUser = await User.findOne({
                email: req.body.email.toLowerCase(),
                _id: { $ne: user._id },
            });
            if (existingUser) {
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = req.body.email.toLowerCase();
        }

        // Update other fields
        if (req.body.name) user.name = req.body.name.trim();
        if (req.body.bio !== undefined) user.bio = req.body.bio;
        if (req.body.profilePicture !== undefined) {
            user.profilePicture = req.body.profilePicture;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            profilePicture: updatedUser.profilePicture,
            bio: updatedUser.bio,
            isOnline: updatedUser.isOnline,
            lastSeen: updatedUser.lastSeen,
        });
    } catch (error) {
        console.error("updateProfile error:", error);
        res.status(500).json({ message: error.message });
    }
};