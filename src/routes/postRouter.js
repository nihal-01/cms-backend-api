const router = require("express").Router();

const auth = require("../middleware/auth");
const Post = require("../models/post.model");
const User = require("../models/user.model");

router.post("/", auth, async (req, res) => {
    try {
        const newPost = new Post(req.body);
        newPost
            .save()
            .then((response) => {
                res.status(201).json(response);
            })
            .catch((e) => {
                res.status(400).send(e);
            });
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get all posts
router.get("/", async (req, res) => {
    try {
        const page = req.query?.page;
        const limit = 5;

        const posts = await Post.find(
            req.query.category
                ? { categories: { $elemMatch: { $eq: req.query.category } } }
                : {}
        )
            .lean()
            .limit(limit)
            .skip((page ? page : 1) * limit - limit)
            .populate("author", "_id username avatar")
            .populate("numComments")
            .exec();

        if (posts.length < 1) {
            return res.status(400).send({ message: "No posts found" });
        }

        const populatedPosts = posts.map((post, index) => {
            return { ...post, numComments: posts[index].numComments };
        });

        const totalPosts = await Post.find(
            req.query.category
                ? { categories: { $elemMatch: { $eq: req.query.category } } }
                : {}
        ).count();

        res.status(200).json({ posts: populatedPosts, totalPosts: totalPosts });
    } catch (e) {
        if (e.codeName === "BadValue") {
            return res.status(400).send({ message: "No posts found" });
        }
        res.status(500).send(e);
    }
});

// Get a single post
router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id })
            .populate("author")
            .populate({ path: "comments", populate: { path: "author" } })
            .exec();
        if (!post) {
            return res.status(404).json({ message: "No posts found" });
        }
        res.status(200).json({ post, comments: post.comments });
    } catch (e) {
        if (e.name === "CastError") {
            return res.status(404).json({ message: "No posts found" });
        }
        res.status(500).send(e);
    }
});

router.delete("/:id", auth, async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id });
        await post.remove();

        if (!post) {
            return res.status(404).send({ message: "No post found" });
        }

        res.status(200).send({ staus: "ok", _id: post._id });
    } catch (e) {
        if (e.name === "CastError") {
            return res.status(404).json({ message: "No post found" });
        }
        res.status(500).send(e);
    }
});

router.patch("/:id", auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
        "title",
        "categories",
        "thumbnail",
        "description",
        "body",
    ];
    if (!updates.every((update) => allowedUpdates.includes(update))) {
        return res
            .status(400)
            .send({ message: "You can only update " + allowedUpdates });
    }
    try {
        const post = await Post.findOne({
            _id: req.params.id,
            author: req.user._id,
        });
        if (!post) {
            return res.status(404).send({ message: "No post found" });
        }
        updates.forEach((update) => (post[update] = req.body[update]));
        await post.save();
        res.status(200).json(post);
    } catch (e) {
        if (e.name === "CastError") {
            return res.status(404).json({ message: "No post found" });
        }
        res.status(500).send(e);
    }
});

// get posts by username
router.get("/user/:username", async (req, res) => {
    try {
        const username = req.params.username;
        const page = req.query?.page;
        const limit = 5;

        const user = await User.findOne({ username });
        if (!user) {
            return res
                .status(404)
                .send({ message: "No user with this username" });
        }

        const posts = await Post.find({ author: user._id })
            .lean()
            .limit(limit)
            .skip((page ? page : 1) * limit - limit)
            .populate("author", "_id username avatar")
            .populate("numComments")
            .exec();

        if (posts.length < 1) {
            return res.status(400).send({ message: "No posts found" });
        }

        const populatedPosts = posts.map((post, index) => {
            return { ...post, numComments: posts[index].numComments };
        });

        const totalPosts = await Post.find({ author: user._id }).count();

        res.status(200).json({ posts: populatedPosts, totalPosts: totalPosts });
    } catch (e) {
        if (e.codeName === "BadValue") {
            return res.status(400).send({ message: "No posts found" });
        }
        res.status(500).send(e);
    }
});

module.exports = router;
