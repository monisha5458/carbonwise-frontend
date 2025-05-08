import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const CommentsPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('jwtToken');

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/community/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to fetch post. Please try again.');
    }
  };

  const handleCommentChange = (e) => {
    setCommentText(e.target.value);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setError('Comment cannot be empty.');
      return;
    }

    try {
      // Add the new comment to the post
      const response = await axios.post(`http://localhost:3000/community/${postId}/comment`, null, {
        params: { comment: commentText },
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Update the post with the new comment
      setPost(prev => ({
        ...prev,
        comments: [...prev.comments, commentText],
      }));
      setCommentText('');
      console.log("Post comments:", post.comments);

    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Comments</h1>
      </header>

      <main className="p-4">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {post ? (
          <div className="bg-white p-4 rounded shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">{post.postTitle}</h2>
            <p className="mb-4">{post.postCaption}</p>
            {post?.imageUrl && (
              <img
                src={`http://localhost:3000${post.imageUrl}`}
                alt={post.postTitle}
                className="w-full h-64 object-cover mb-4"
              />
            )}

            <form onSubmit={handleCommentSubmit} className="mb-4">
              <textarea
                value={commentText}
                onChange={handleCommentChange}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                rows="3"
                placeholder="Write your comment here..."
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              >
                Add Comment
              </button>
            </form>
            <h3 className="text-xl font-semibold mb-2">Comments</h3>
            {post.comments.length > 0 ? (
              <ul>
                {post.comments.map((comment, index) => (
                  <li key={index} className="border-b py-2">
                    <p>{comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No comments yet.</p>
            )}
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </main>
    </div>
  );
};

export default CommentsPage;
