const router = require("express").Router();
const multer = require("multer");
const sharp = require("sharp");
const crypto = require("crypto");

const User = require("../models/user.model");
const auth = require("../middleware/auth");
const passwordResetMail = require("../utils/passwordResetMail");
const getUserByInfo = require("../utils/getUserByInfo");

router.post("/", async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (user) {
        return res.status(400).json({ message: "Username already taken" });
    }

    User.create(req.body)
        .then(async (response) => {
            token = await response.generateAuthToken();
            res.status(201).json({ response, token });
        })
        .catch((e) => {
            if (e.name === "ValidationError") {
                res.status(422).json(e);
            } else if (e.code === 11000) {
                res.status(400).jsonp({ message: "Email already exists" });
            } else {
                res.status(500).json(e);
            }
        });
});

// Check username is already exists
router.post("/validate-username", async (req, res) => {
    if (req.body.username) {
        try {
            const user = await User.findOne({ username: req.body.username });
            if (user) {
                return res
                    .status(400)
                    .json({ message: "Username already taken" });
            }
            res.status(200).send({});
        } catch (e) {
            res.status(500).send(e);
        }
    } else {
        res.status(400).json({ message: "Username is Empty" });
    }
});

router.post("/login", async (req, res) => {
    if (!req.body.username && !req.body.password) {
        return res.status(400).json({ message: "Email or Password is Empty" });
    }
    User.findByCredentials(req.body.username, req.body.password)
        .then(async (response) => {
            const token = await response.generateAuthToken();
            res.status(200).json({ response, token });
        })
        .catch((e) => {
            res.status(400).json({ message: e });
        });
});

router.post("/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((tokenObj) => {
            return tokenObj.token !== req.token;
        });
        await req.user.save();
        res.status(200).json({ message: "Logged out successfully" });
    } catch (e) {
        res.status(500).send(e);
    }
});

router.post("/logout-all", auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.status(200).json({
            message: "You logged out successfully from all devices",
        });
    } catch (e) {
        res.status(500).send(e);
    }
});

router.get("/me", auth, async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.patch("/me", auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ["fname", "username", "email"];
        if (!updates.every((update) => allowedUpdates.includes(update))) {
            return res
                .status(400)
                .send({ message: "You can only update " + allowedUpdates });
        }

        updates.forEach((update) => {
            req.user[update] = req.body[update];
        });
        await req.user.save();
        res.status(200).json(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.delete("/me", auth, async (req, res) => {
    try {
        await req.user.remove();
        res.status(200).send({ status: "ok" });
    } catch (e) {
        res.status(500).send(e);
    }
});

// Image validation using multer
const upload = multer({
    limits: {
        fileSize: 2000000,
    },
    fileFilter: (req, file, cb) => {
        const allowed = ["jpg", "jpeg", "png"];
        if (!allowed.includes(file.originalname.split(".")[1])) {
            return cb(new Error("Please upload jpg, jpeg, or png"));
        }
        cb(undefined, true);
    },
});

// Upload Avatar
router.post(
    "/me/avatar",
    auth,
    upload.single("avatar"),
    async (req, res) => {
        if (!req.file) {
            return res.status(404).send({ message: "No file found" });
        }

        try {
            const buffer = await sharp(req.file.buffer)
                .resize({ width: 250, height: 250 })
                .png()
                .toBuffer();
            req.user.avatar = buffer;
            await req.user.save();
            res.status(200).send(req.user);
        } catch (e) {
            res.status(500).send(e);
        }
    },
    (error, req, res, next) => {
        res.status(400).send({ message: error.message });
    }
);

router.get("/:id/avatar", async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        if (!user || !user.avatar) {
            return res.status(404).send({ message: "No images found" });
        }

        res.set("Content-Type", "image/jpeg");
        res.status(200).send(user.avatar);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.delete("/me/avatar", auth, async (req, res) => {
    try {
        if (!req.user?.avatar) {
            return res.status(404).send({ message: "You have no avatar" });
        }
        req.user.avatar = undefined;
        await req.user.save();
        res.status(200).send({ status: "ok" });
    } catch (e) {
        res.status(500).send(e);
    }
});

// forget password
router.post("/forget-password", async (req, res) => {
    try {
        const { userInfo } = req.body;

        if (!userInfo) {
            return res.status(404).send({ message: "userInfo not found" });
        }

        const user = await getUserByInfo(userInfo);

        if (!user) {
            return res
                .status(404)
                .send({ message: "No user found with this info" });
        }

        passwordResetMail(user.email)
            .then((otp) => {
                user.otp = otp;
                user.save().then(() => {
                    res.status(200).send({ userInfo });
                });
            })
            .catch((e) => {
                res.status(400).send(e);
            });
    } catch (e) {
        res.status(500).send(e);
    }
});

// check is otp valid
router.post("/forget-password/otp", async (req, res) => {
    try {
        const { userInfo, otp } = req.body;

        if (!userInfo && !otp) {
            return res.status(404).send({ message: "userInfo, otp not found" });
        }

        const user = await getUserByInfo(userInfo);

        if (!user) {
            return res
                .status(404)
                .send({ message: "No user found with this info" });
        }

        if (user.otp !== parseInt(otp)) {
            return res.status(400).send({ message: "Incorrect otp" });
        }

        user.resetPasswordToken = crypto.randomBytes(32).toString("hex");
        await user.save();

        res.status(200).json({ status: "ok", token: user.resetPasswordToken });
    } catch (e) {
        res.status(500).send(e);
    }
});

// update password by token
router.post("/update-password/:token", async (req, res) => {
    try {
        const { password } = req.body;
        const { token } = req.params;

        const user = await User.findOne({ resetPasswordToken: token });
        if (!user) {
            return res
                .status(401)
                .send({ message: "Invalid token or token not found" });
        }

        if (!password) {
            return res.status(404).send({ message: "password not found" });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.otp = undefined;
        await user.save();
        res.status(200).send({ status: "ok" });
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;
