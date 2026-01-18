import React, { useState, useEffect } from 'react';
import './App.css';
import TruckExperience from './truckStateMachine.jsx';
import { signInWithGoogle, signOutUser, onAuthStateChangedListener } from './firebaseAuth';
import AuthPanel from './components/AuthPanel.jsx';
import PlaylistPanel from './components/PlaylistPanel.jsx';
import PlaybackControls from './components/PlaybackControls.jsx';
import PlayerStage from './components/PlayerStage.jsx';
import usePlayback from './hooks/usePlayback.js';
import usePlaylists from './hooks/usePlaylists.js';
function App() {
  const assets = {
    idle: "/truck_idle.mp4",
    talking: "/truck_talking.mp4",
    driving: "/truck_driving.mp4"
  };
  const breakVideo = "/truck_sleep.mp4";
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const {
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
  } = usePlaylists();
  const {
    appRef,
    activeVideoId,
    breakSeconds,
    countdown,
    cycleIndex,
    handleVideoEnd,
    hasStarted,
    onBreak,
    onReady,
    onStateChange,
    playSeconds,
    playing,
    screen,
    setBreakSeconds,
    setPlaySeconds,
    setScreen,
    setTotalCycles,
    setVideoIdError,
    setVideoIds,
    startPlayback,
    startPlaySegment,
    totalCycles,
    videoIdError,
    videoIds,
  } = usePlayback();

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(currentUser => {
      setUser(currentUser);
      if (!currentUser) {
        setAccessToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      if (result?.user) {
        setUser(result.user);
        setAccessToken(result.accessToken || null);
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setUser(null);
      setAccessToken(null);
      clearPlaylists();
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  const handleAddVideoId = (videoId) => {
    const trimmed = (videoId || '').trim();
    if (!trimmed) {
      return;
    }
    setVideoIds(prev => {
      const normalized = prev.map(id => id.trim()).filter(Boolean);
      if (normalized.includes(trimmed)) {
        setVideoIdError('Duplicate YouTube video IDs are not allowed.');
        return prev;
      }
      setVideoIdError('');
      return [...prev, trimmed];
    });
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      mute: 0,
      playsinline: 1,
    },
  };

  const introMessage = "Welcome Evan, how are you! Let's watch some videos together. Get comfy and have fun!";
  const endMessage = "Bye-bye! I need a break to fuel up and get my energy back. See you soon!";

  if (screen === 'intro') {
    return (
      <TruckExperience
        customMessage={introMessage}
        videoPaths={assets}
        onComplete={() => {
          setScreen('player');
          startPlaySegment(1);
        }}
      />
    );
  }

  if (screen === 'end') {
    return (
      <TruckExperience
        customMessage={endMessage}
        videoPaths={assets}
      />
    );
  }

  const videoContainerClass = `video-container ${
    hasStarted ? (playing ? 'is-playing' : 'is-paused') : 'is-preload'
  }`;

  return (
    <div className="App" ref={appRef}>
      <AuthPanel
        user={user}
        isLoadingPlaylists={isLoadingPlaylists}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onFetchPlaylists={() => handleFetchPlaylists({ user, accessToken })}
      />
      <PlaylistPanel
        playlists={playlists}
        playlistError={playlistError}
        isLoadingVideos={isLoadingVideos}
        playlistVideos={playlistVideos}
        playlistVideosToken={playlistVideosToken}
        activePlaylistId={activePlaylistId}
        onFetchPlaylistVideos={(playlistId, pageToken) =>
          handleFetchPlaylistVideos({ accessToken, playlistId, pageToken })
        }
        onAddVideoId={handleAddVideoId}
      />
      {!playing && !onBreak && screen === 'player' && (
      <PlaybackControls
        videoIds={videoIds}
        videoIdError={videoIdError}
        playSeconds={playSeconds}
        breakSeconds={breakSeconds}
        totalCycles={totalCycles}
        onChangeVideoId={(index, value) => {
          const nextIds = [...videoIds];
          nextIds[index] = value;
          setVideoIds(nextIds);
          if (videoIdError) {
            setVideoIdError('');
          }
        }}
          onRemoveVideoId={(index) => {
            const nextIds = videoIds.filter((_, i) => i !== index);
            setVideoIds(nextIds.length ? nextIds : ['']);
          }}
          onAddVideoInput={() => setVideoIds([...videoIds, ''])}
          onStartPlayback={startPlayback}
          onSetPlaySeconds={value => setPlaySeconds(value)}
          onSetBreakSeconds={value => setBreakSeconds(value)}
          onSetTotalCycles={value => setTotalCycles(value)}
        />
      )}

      <PlayerStage
        activeVideoId={activeVideoId}
        videoContainerClass={videoContainerClass}
        opts={opts}
        onReady={onReady}
        onEnd={handleVideoEnd}
        onStateChange={onStateChange}
        playing={playing}
        countdown={countdown}
        cycleIndex={cycleIndex}
        totalCycles={totalCycles}
        onBreak={onBreak}
        breakVideo={breakVideo}
      />

    </div>
  );
}

export default App;
