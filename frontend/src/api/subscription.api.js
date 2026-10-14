import api from './axios';

export const toggleSubscription = async (channelId) => {
  const response = await api.post(`/subscriptions/c/${channelId}`);
  return response.data;
};

export const getSubscriptionStatus = async (channelId) => {
  const response = await api.get(`/subscriptions/c/${channelId}/status`);
  return response.data;
};

export const getSubscribedChannels = async (subscriberId) => {
  const response = await api.get(`/subscriptions/u/${subscriberId}`);
  return response.data;
};

export const getSubscribedFeed = async (channelId = null) => {
  const response = await api.get('/subscriptions/feed', {
    params: channelId ? { channelId } : {},
  });
  return response.data;
};
