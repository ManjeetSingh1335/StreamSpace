import api from './axios';

export const registerUser = async (formData) => {
  const response = await api.post('/users/register', formData);
  return response.data;
};

export const loginUser = async ({ emailOrUsername, password }) => {
  // Support either username or email
  const payload = { password };
  if (emailOrUsername.includes('@')) {
    payload.email = emailOrUsername;
  } else {
    payload.username = emailOrUsername;
  }
  const response = await api.post('/users/login', payload);
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/users/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/users/current-user');
  return response.data;
};

export const getUserChannelProfile = async (username) => {
  const response = await api.get(`/users/c/${username}`);
  return response.data;
};

export const updateUserCoverImage = async (formData) => {
  const response = await api.patch('/users/cover-image', formData);
  return response.data;
};
