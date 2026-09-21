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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.name = req.body.name || user.name;
        user.profilePicture = req.body.profilePicture || user.profilePicture;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            profilePicture: updatedUser.profilePicture,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};