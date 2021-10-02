const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Post = require("./post.model");

const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: { unique: true },
        validate(value) {
            if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
                throw new Error("Please Provide a valid Email");
            }
        },
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        validate(value) {
            if (!/^(?!password)\S{4}\S+$/.test(value)) {
                throw new Error("Invalid Password!");
            }
        },
    },
    tokens: [
        {
            token: {
                type: String,
                required: true,
            },
        },
    ],
    avatar: {
        type: Buffer,
    },
    otp: {
        type: Number,
        trim: true,
    },
    resetPasswordToken: {
        type: String,
    },
});

userSchema.methods.toJSON = function () {
    const user = this;
    const userObj = user.toObject();

    delete userObj.password;
    delete userObj.tokens;
    delete userObj.avatar;
    delete userObj.resetPasswordToken;
    delete userObj.otp;

    return userObj;
};

userSchema.methods.generateAuthToken = async function () {
    const user = this;

    const token = jwt.sign({ _id: user._id.toString() }, "secret", {
        expiresIn: "24hr",
    });
    user.tokens = [...user.tokens, { token }];
    await user.save();
    return token;
};

userSchema.statics.findByCredentials = async function (username, password) {
    return new Promise(async (reslove, reject) => {
        const user = await this.findOne({ username: username });
        if (!user) {
            return reject("Unable to find your account");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return reject("Incorrect password");
        }
        reslove(user);
    });
};

userSchema.pre("save", async function (next) {
    const user = this;

    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

userSchema.pre("remove", async function (next) {
    const user = this;

    await Post.deleteMany({ author: user._id });
    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
