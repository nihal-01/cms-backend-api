const User = require("../models/user.model");

const getUserByInfo = async (userInfo) => {
    let user;
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userInfo)) {
        const email = userInfo;
        user = await User.findOne({ email: email });
    } else {
        const username = userInfo;
        user = await User.findOne({ username: username });
    }
    return user;
};

module.exports = getUserByInfo;