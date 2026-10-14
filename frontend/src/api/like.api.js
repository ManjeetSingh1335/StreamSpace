import api from './axios';

export const toggleVideoLike = async (videoId) => {
  const response = await api.post(`/likes/toggle/v/${videoId}`);
  return response.data;
};

export const getLikedVideos = async () => {
  const response = await api.get('/likes/videos');
  return response.data;
};

export const toggleTweetLike = async (tweetId) => {
  const response = await api.post(`/likes/toggle/t/${tweetId}`);
  return response.data;
};
