const router = require("express").Router();

const auth = require("../middleware/auth");
const Comment = require("../models/comment.model");

router.post("/", auth, (req, res) => {
    try {
        const newComment = new Comment(req.body);
        newComment
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

router.delete("/:id", auth, async (req, res) => {
    try {
        const comment = await Comment.findOneAndDelete({ _id: req.params.id });
        if (!comment) {
            return res.status(404).send({ message: "comment not found" });
        }
        res.status(200).json({ status: "ok", _id: comment._id });
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;
