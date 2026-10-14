import api from './axios';

export const getAllVideos = async (params = {}) => {
  const response = await api.get('/videos', { params });
  return response.data;
};

export const getVideoById = async (videoId) => {
  const response = await api.get(`/videos/${videoId}`);
  return response.data;
};

export const publishVideo = async (formData, onProgress) => {
  const response = await api.post('/videos', formData, {
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
  return response.data;
};

export const deleteVideo = async (videoId) => {
  const response = await api.delete(`/videos/${videoId}`);
  return response.data;
};

export const togglePublishStatus = async (videoId) => {
  const response = await api.patch(`/videos/toggle/publish/${videoId}`);
  return response.data;
};
