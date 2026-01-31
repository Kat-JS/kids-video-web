import React from 'react';

const AuthPanel = ({ user, isLoadingPlaylists, onLogin, onLogout, onFetchPlaylists }) => (
  <div>
    {user ? (
      <div>
        <span>Logged in as {user.displayName || user.email || 'Google user'}</span>
        <button onClick={onLogout}>Log out</button>
        <button onClick={onFetchPlaylists} disabled={isLoadingPlaylists}>
          {isLoadingPlaylists ? 'Loading playlists...' : 'Load YouTube Playlists'}
        </button>
      </div>
    ) : (
      <button onClick={onLogin}>Sign in with Google</button>
    )}
  </div>
);

export default AuthPanel;
