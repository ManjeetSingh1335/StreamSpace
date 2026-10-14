import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Image, CheckCircle, AlertCircle } from 'lucide-react';
import { publishVideo } from '../api/video.api';
import { useAuth } from '../context/AuthContext';

export const UploadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (!title) {
        // Auto-fill title from filename without extension
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setTitle(cleanName);
      }
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('Please log in to upload a video.');
      return;
    }
    if (!videoFile) {
      setErrorMessage('Please select a video file.');
      return;
    }
    if (!thumbnailFile) {
      setErrorMessage('Please select a thumbnail image.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Title and description are required.');
      return;
    }

    setErrorMessage('');
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('videoFile', videoFile);
    formData.append('thumbnail', thumbnailFile);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    if (tags.trim()) {
      formData.append('tags', tags.trim());
    }

    try {
      const res = await publishVideo(formData, (progress) => {
        setUploadProgress(progress);
      });
      const createdVideo = res?.data;
      if (createdVideo?._id) {
        navigate(`/watch/${createdVideo._id}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to upload video. Please try again.'
      );
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-black tracking-tight">Upload Video</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Share your video with millions of viewers across StreamSpace.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-black">
          <AlertCircle className="w-4 h-4 text-black flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drag & Drop File Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => videoInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-300 hover:border-black rounded-2xl p-8 sm:p-12 text-center cursor-pointer bg-neutral-50 hover:bg-neutral-100/60 transition group flex flex-col items-center justify-center"
        >
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-full bg-white border border-neutral-200 flex items-center justify-center mb-4 group-hover:scale-105 transition shadow-sm">
            <UploadCloud className="w-7 h-7 text-black stroke-[1.75]" />
          </div>

          <h3 className="text-base font-bold text-black mb-1">
            {videoFile ? videoFile.name : 'Drag & drop your video here'}
          </h3>

          <p className="text-xs text-neutral-500 max-w-sm mb-4">
            Supports MP4, MOV, AVI up to 2GB • Max duration 15 minutes
          </p>

          <button
            type="button"
            className="px-5 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-neutral-800 transition shadow-sm"
          >
            {videoFile ? 'Change Video File' : 'Select Files'}
          </button>
        </div>

        {/* Thumbnail Picker Section */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-black block">
            Thumbnail Image (Required)
          </label>
          <div
            onClick={() => thumbnailInputRef.current?.click()}
            className="border border-neutral-300 hover:border-black rounded-xl p-4 cursor-pointer bg-neutral-50 flex items-center gap-4 transition"
          >
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailSelect}
              className="hidden"
            />
            {thumbnailPreview ? (
              <img
                src={thumbnailPreview}
                alt="Preview"
                className="w-28 aspect-video object-cover rounded-lg border border-neutral-200"
              />
            ) : (
              <div className="w-28 aspect-video rounded-lg bg-neutral-200 flex items-center justify-center text-neutral-400">
                <Image className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 text-xs">
              <p className="font-semibold text-black">
                {thumbnailFile ? thumbnailFile.name : 'Click to select high-res thumbnail'}
              </p>
              <p className="text-neutral-500 mt-0.5">JPG, PNG, WebP (16:9 ratio recommended)</p>
            </div>
          </div>
        </div>

        {/* Form Details */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-black block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title..."
              className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black focus:bg-white transition"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-black block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video..."
              rows={4}
              className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black focus:bg-white transition resize-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-black block">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add tags e.g. nature, travel, vlog..."
              className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black focus:bg-white transition"
            />
          </div>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-black">
              <span>Uploading to Cloudinary...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-200 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isUploading}
            className="px-8 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition shadow-sm"
          >
            {isUploading ? `Uploading (${uploadProgress}%)` : 'Upload Video'}
          </button>
        </div>
      </form>
    </div>
  );
};
