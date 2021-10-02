const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decode = jwt.verify(token, "secret");
        const user = await User.findOne({
            _id: decode._id,
            "tokens.token": token,
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid Token" });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (e) {
        res.status(401).json({ message: e.message });
    }
};

module.exports = auth;
