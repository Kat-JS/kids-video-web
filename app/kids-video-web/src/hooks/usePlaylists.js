import { useState } from 'react';

const usePlaylists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [playlistError, setPlaylistError] = useState('');
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [playlistVideosToken, setPlaylistVideosToken] = useState('');
  const [activePlaylistId, setActivePlaylistId] = useState('');
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  const clearPlaylists = () => {
    setPlaylists([]);
    setPlaylistVideos([]);
    setPlaylistVideosToken('');
    setActivePlaylistId('');
    setPlaylistError('');
    setIsLoadingPlaylists(false);
    setIsLoadingVideos(false);
  };

  const handleFetchPlaylists = async ({ user, accessToken }) => {
    if (!user) {
      return;
    }
    if (!accessToken) {
      setPlaylistError('Missing Google access token. Please sign in again.');
      return;
    }
    setIsLoadingPlaylists(true);
    setPlaylistError('');
    try {
      const res = await fetch(
        'http://127.0.0.1:5001/firm-foundation-484104-j4/us-central1/api/youtube/playlists',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Playlist request failed (${res.status}). ${errorText}`);
      }
      const data = await res.json();
      setPlaylists(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error('Playlist request failed:', error);
      setPlaylistError(error.message || 'Playlist request failed.');
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const handleFetchPlaylistVideos = async ({ accessToken, playlistId, pageToken = '' }) => {
    if (!accessToken || !playlistId) {
      return;
    }
    setIsLoadingVideos(true);
    setPlaylistError('');
    try {
      const query = pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : '';
      const res = await fetch(
        `http://127.0.0.1:5001/firm-foundation-484104-j4/us-central1/api/youtube/playlist/${playlistId}/videos${query}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Video request failed (${res.status}). ${errorText}`);
      }
      const data = await res.json();
      const videos = Array.isArray(data?.videos) ? data.videos : [];
      setActivePlaylistId(playlistId);
      setPlaylistVideosToken(data?.nextPageToken || '');
      setPlaylistVideos(prev =>
        pageToken ? [...prev, ...videos] : videos
      );
    } catch (error) {
      console.error('Video request failed:', error);
      setPlaylistError(error.message || 'Video request failed.');
    } finally {
      setIsLoadingVideos(false);
    }
  };

  return {
    activePlaylistId,
    clearPlaylists,
    handleFetchPlaylistVideos,
    handleFetchPlaylists,
    isLoadingPlaylists,
    isLoadingVideos,
    playlistError,
    playlistVideos,
    playlistVideosToken,
    playlists,
  };
};

export default usePlaylists;
