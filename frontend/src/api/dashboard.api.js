import api from './axios';

export const getChannelStats = async (channelId) => {
  const url = channelId ? `/dashboard/stats/${channelId}` : '/dashboard/stats';
  const response = await api.get(url);
  return response.data;
};

export const getChannelVideos = async (params = {}) => {
  const response = await api.get('/dashboard/videos', { params });
  return response.data;
};
