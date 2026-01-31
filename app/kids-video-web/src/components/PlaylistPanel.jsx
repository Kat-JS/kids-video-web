import React from 'react';

const resolvePlaylistId = (playlist) =>
  playlist?.playlistId || playlist?.id || playlist?.snippet?.playlistId || '';

const PlaylistPanel = ({
  playlists,
  playlistError,
  isLoadingVideos,
  playlistVideos,
  playlistVideosToken,
  activePlaylistId,
  onFetchPlaylistVideos,
  onAddVideoId,
}) => (
  <>
    {!!playlistError && <div>{playlistError}</div>}
    {!!playlists.length && (
      <div>
        <h3>Your Playlists</h3>
        <ul>
          {playlists.map(playlist => {
            const playlistId = resolvePlaylistId(playlist);
            const title = playlist.title || playlist.snippet?.title || 'Untitled playlist';
            return (
              <li key={playlistId || title}>
                <button
                  onClick={() => onFetchPlaylistVideos(playlistId)}
                  disabled={!playlistId || isLoadingVideos}
                >
                  {title}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    )}
    {!!playlistVideos.length && (
      <div>
        <h3>Playlist Videos</h3>
        <div>
          {playlistVideos.map(video => (
            <div key={video.videoId || video.title}>
              {video.thumbnail && (
                <img
                  src={video.thumbnail}
                  alt={video.title || 'Video'}
                  onClick={() => onAddVideoId(video.videoId)}
                  style={{ cursor: 'pointer' }}
                />
              )}
              <div>{video.title || 'Untitled video'}</div>
              {!!video.videoId && (
                <button onClick={() => onAddVideoId(video.videoId)}>
                  Add to list
                </button>
              )}
            </div>
          ))}
        </div>
        {playlistVideosToken && (
          <button
            onClick={() => onFetchPlaylistVideos(activePlaylistId, playlistVideosToken)}
            disabled={isLoadingVideos}
          >
            {isLoadingVideos ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    )}
  </>
);

export default PlaylistPanel;
