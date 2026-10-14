import api from './axios';

export const createTweet = async (formData) => {
  const response = await api.post('/tweets', formData);
  return response.data;
};

export const getUserTweets = async (userId) => {
  const response = await api.get(`/tweets/user/${userId}`);
  return response.data;
};

export const updateTweet = async (tweetId, content) => {
  const response = await api.patch(`/tweets/${tweetId}`, { content });
  return response.data;
};

export const deleteTweet = async (tweetId) => {
  const response = await api.delete(`/tweets/${tweetId}`);
  return response.data;
};

export const toggleTweetLike = async (tweetId) => {
  const response = await api.post(`/likes/toggle/t/${tweetId}`);
  return response.data;
};
