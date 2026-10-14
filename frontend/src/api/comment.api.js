import api from './axios';

export const getVideoComments = async (videoId, page = 1) => {
  const response = await api.get(`/comments/${videoId}`, {
    params: { page, limit: 15 },
  });
  return response.data;
};

export const addComment = async (videoId, content) => {
  const response = await api.post(`/comments/${videoId}`, { content });
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await api.delete(`/comments/c/${commentId}`);
  return response.data;
};

export const getTweetComments = async (tweetId, page = 1) => {
  const response = await api.get(`/comments/t/${tweetId}`, {
    params: { page, limit: 20 },
  });
  return response.data;
};

export const addTweetComment = async (tweetId, content) => {
  const response = await api.post(`/comments/t/${tweetId}`, { content });
  return response.data;
};
