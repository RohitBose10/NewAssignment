const Post = require("../models/post.model");
const Like = require("../models/like.model");
const Comment = require("../models/comment.model");

class PostController {
  async addPosts(req, res) {
    try {
      const { title, content, tags, userId, categoryId } = req.body;

      // Optional: Validate required fields
      if (!title || !content || !tags || !userId || !categoryId) {
        return res.status(400).json({ message: "All fields are required." });
      }

      // Create the post
      const newPost = await Post.create({
        userId,
        categoryId,
        title,
        content,
        tags,
      });

      return res.status(201).json({
        message: "Post created successfully",
        data: newPost,
      });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ message: "Error creating post" });
    }
  }

  async listPosts(req, res) {
    try {
      const posts = await Post.aggregate([
        {
          $match: { isDeleted: false },
        },

        // Lookup user
        {
          $lookup: {
            from: "users",
            let: { userId: "$userId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
              { $project: { id: 1, email: 1 } },
            ],
            as: "user",
          },
        },
        { $unwind: "$user" },

        // Lookup category
        {
          $lookup: {
            from: "categories",
            let: { catId: "$categoryId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$catId"] } } },
              { $project: { name: 1, _id: 0 } },
            ],
            as: "category",
          },
        },
        { $unwind: "$category" },

        // Lookup likes
        {
          $lookup: {
            from: "likes",
            let: { postId: "$_id" },
            pipeline: [{ $match: { $expr: { $eq: ["$postId", "$$postId"] } } }],
            as: "likes",
          },
        },

        // Lookup comments with actual fields
        {
          $lookup: {
            from: "comments",
            let: { postId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$postId", "$$postId"] } } },
              {
                $project: {
                  _id: 1,
                  comment: 1,
                },
              },
            ],
            as: "comments",
          },
        },

        // Final shape
        {
          $project: {
            title: 1,
            content: 1,
            tags: 1,

            user: 1,
            category: 1,
            totalLikes: { $size: "$likes" },
            comments: 1, // Full comment details
          },
        },
        //sort according to number of likes
        {
          $sort: { totalLikes: -1 },
        },
      ]);

      return res.status(200).json({
        message: "Posts fetched successfully",
        data: posts,
      });
    } catch (err) {
      console.error("Error listing posts:", err.message);
      return res.status(500).json({ message: "Error fetching posts" });
    }
  }

  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const post = await Post.findByIdAndUpdate(id, updates, {
        new: true,
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      return res
        .status(200)
        .json({ message: "Post updated successfully", data: post });
    } catch (err) {
      console.error("Error updating post:", err.message); // Better error logging
      res
        .status(400)
        .json({ message: "Something went wrong while updating the post" });
    }
  }

  async deletePost(req, res) {
    try {
      const { id } = req.params;
  
      const post = await Post.findByIdAndDelete(id);
  
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      return res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
      console.error("Error deleting post:", err.message);
      return res
        .status(400)
        .json({ message: "Something went wrong while deleting the post" });
    }
  }
  

  async likePost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const existingLike = await Like.findOne({ postId, userId });

      if (existingLike) {
        await Like.findOneAndDelete({ postId, userId });
        return res.status(200).json({ message: "Like removed successfully." });
      } else {
        await Like.create({ postId, userId });
        return res.status(201).json({ message: "Post liked successfully." });
      }
    } catch (err) {
      console.error("Error liking post:", err.message);
      return res.status(500).json({ message: "Error liking the post" });
    }
  }

  async commentOnPost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;
      const { comment } = req.body;

      if (!comment) {
        return res.status(400).json({ message: "Comment text is required." });
      }

      await Comment.create({ postId, userId, comment });

      return res.status(201).json({ message: "Comment added successfully." });
    } catch (err) {
      console.error("Error commenting on post:", err.message);
      return res.status(500).json({ message: "Error commenting on the post" });
    }
  }
}

module.exports = new PostController();
