const express = require("express");
const cors = require("cors");

const userRouter = require("./routes/userRouter");
const postRouter = require("./routes/postRouter");
const commentRouter = require("./routes/commentRouter");
require("dotenv").config();
require("./db/config");

const app = express();
const PORT = process.env.PORT | 3000;

app.use(express.json());
app.use(cors());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);

app.listen(PORT, () => {
    console.log(`Server is up on port ${PORT}`);
});
