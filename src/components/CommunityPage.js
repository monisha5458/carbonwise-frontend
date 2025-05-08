import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [likedPosts, setLikedPosts] = useState(new Set()); // Track liked posts
  const token = localStorage.getItem('jwtToken');

  useEffect(() => {
    if (!userId || !token) {
      navigate('/authpage');
    } else {
      fetchPosts();
      fetchUserData();
    }
  }, [navigate, userId, token]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:3000/community', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setPosts(response.data);
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to fetch posts. Please try again.');
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/carbonTrack/profile/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setUserName(response.data.name);
      setUserEmail(response.data.email);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handlePostChange = (e) => {
    setNewPost(e.target.value);
  };

  const handleTitleChange = (e) => {
    setPostTitle(e.target.value);
  };

  const handleImageChange = (e) => {
    setSelectedImage(e.target.files[0]);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !postTitle.trim()) {
      setError('Post title and content cannot be empty.');
      return;
    }

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('user_name', userName);
    formData.append('postTitle', postTitle);
    formData.append('postCaption', newPost);
    if (selectedImage) {
      formData.append('image', selectedImage);
    }
  
    
    try {
      const response = await axios.post('http://localhost:3000/community/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        
      });
      setPosts([response.data]);
      setNewPost('');
      setPostTitle('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    }
  };

  const handleLike = async (postId) => {
    if (likedPosts.has(postId)) {
      alert('You have already liked this post.');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:3000/community/${postId}/like`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setPosts(posts.map(post =>
        post.postId === postId ? { ...post, likes: response.data.likes } : post));
      setLikedPosts(new Set([...likedPosts, postId])); // Mark as liked
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentChange = (postId, e) => {
    setCommentText(prev => ({ ...prev, [postId]: e.target.value }));
  };

  const handleCommentSubmit = async (postId, e) => {
    e.preventDefault();
    const newComment = commentText[postId];
    if (!newComment.trim()) {
      setError('Comment cannot be empty.');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:3000/community/${postId}/comment`, null, {
        params: { comment: newComment },
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setPosts(posts.map(post => post.postId === postId ? response.data : post));
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      setSelectedPostId(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    }
  };
  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:3000/community/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post. Please try again.');
    }
  };

  

  const handleViewComments = (postId) => {
    navigate(`/comments/${postId}`);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Community</h1>
        <nav className="space-x-6">
          <a href="/carbontracker" className="mx-4 hover:text-blue-500">Carbon Tracker</a>
          <a href="/community" className="mx-4 hover:text-blue-500">Community</a>
          <span className="mx-4">Welcome, {userName}</span>
          <button onClick={() => { localStorage.removeItem('userId'); localStorage.removeItem('jwtToken'); navigate('/authpage'); }} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
        </nav>
      </header>

      <main className="p-4">
        <div className="bg-white p-4 rounded shadow-lg max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Create a New Post</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handlePostSubmit}>
            <input
              type="text"
              value={postTitle}
              onChange={handleTitleChange}
              className="w-full px-3 py-2 border rounded-lg mb-4"
              placeholder="Post Title"
            />
            <textarea
              value={newPost}
              onChange={handlePostChange}
              className="w-full px-3 py-2 border rounded-lg mb-4"
              rows="4"
              placeholder="Write your post here..."
            />
            <input
              type="file"
              onChange={handleImageChange}
              className="w-full mb-4"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Post
            </button>
          </form>
        </div>

        <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4 ml-[173px]">Posts</h2>
          <div className="bg-white p-4 rounded shadow-lg max-w-4xl mx-auto">
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <div key={post._id} className="border p-4 rounded shadow-lg bg-white">
                    <h3 className="text-lg font-semibold mb-2">{post.postTitle}</h3>
                    <p className="mb-2">{post.postCaption}</p>
                    {console.log(post.imageUrl)}
                    {post.imageUrl && (
                      <img
                      src={`http://localhost:3000${post.imageUrl}`}
                      alt={post.postTitle}
                      className="w-full h-64 object-cover mb-2"
                    />
                    
                    ) }
                    <div className="flex items-center space-x-4 mt-2">
                      <button
                        onClick={() => handleLike(post._id)}
                        className="bg-green-500 text-white px-2 py-1 rounded-lg"
                      >
                        Like ({post.likes})
                      </button>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="bg-red-500 text-white px-2 py-1 rounded-lg"
            >
                        Delete
                        </button>

                      <button
                        onClick={() => handleViewComments(post._id)}
                        className="bg-blue-500 text-white px-2 py-1 rounded-lg"
                      >
                        View Comments
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No posts available.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunityPage;
