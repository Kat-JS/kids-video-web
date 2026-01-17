import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import './App.css';
import TruckExperience from './truckStateMachine.jsx';
import { signInWithGoogle, signOutUser, onAuthStateChangedListener } from './firebaseAuth';
function App() {
  const assets = {
    idle: "/truck_idle.mp4",
    talking: "/truck_talking.mp4",
    driving: "/truck_driving.mp4"
  };
  const breakVideo = "/truck_sleep.mp4";
  const [videoIds, setVideoIds] = useState(['']);
  const [activeVideoId, setActiveVideoId] = useState('');
  const [playSeconds, setPlaySeconds] = useState(20);
  const [breakSeconds, setBreakSeconds] = useState(10);
  const [totalCycles, setTotalCycles] = useState(1);
  const [cycleIndex, setCycleIndex] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [videoIdError, setVideoIdError] = useState('');
  const [onBreak, setOnBreak] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [screen, setScreen] = useState('player');
  const [playerReady, setPlayerReady] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [playlistError, setPlaylistError] = useState('');
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [playlistVideosToken, setPlaylistVideosToken] = useState('');
  const [activePlaylistId, setActivePlaylistId] = useState('');
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const playerRef = useRef(null);
  const appRef = useRef(null);
  const timerRef = useRef(null);
  const playingRef = useRef(false);
  const normalizeVideoIds = (ids) =>
    ids.map(id => id.trim()).filter(Boolean);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(currentUser => {
      setUser(currentUser);
      if (!currentUser) {
        setAccessToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      if (playerRef.current) {
        playerRef.current.stopVideo();
      }
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const requestFullscreen = () => {
    if (!appRef.current) {
      return;
    }
    const element = appRef.current;
    if (element.requestFullscreen) {
      element.requestFullscreen();
      return;
    }
    if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    }
  };

  const playWithoutMute = () => {
    if (!playerRef.current) {
      return;
    }
    playerRef.current.playVideo();
  };

  const startCountdown = (seconds, onDone) => {
    clearTimer();
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearTimer();
          onDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startPlaySegment = (nextCycleIndex) => {
    const normalizedIds = normalizeVideoIds(videoIds);
    if (normalizedIds.length === 0) {
      return;
    }
    setCycleIndex(nextCycleIndex);
    setOnBreak(false);
    setPlaying(true);
    setHasStarted(true);
    setActiveVideoId(normalizedIds[0]);
    playingRef.current = true;
    if (playerRef.current) {
      playWithoutMute();
    }
    startCountdown(playSeconds, () => {
      if (breakSeconds > 0 && nextCycleIndex < totalCycles) {
        startBreakSegment(nextCycleIndex);
      } else if (nextCycleIndex < totalCycles) {
        startPlaySegment(nextCycleIndex + 1);
      } else {
        setPlaying(false);
        setHasStarted(false);
        setCountdown(0);
        clearTimer();
        setScreen('end');
      }
    });
  };

  const startBreakSegment = (currentCycle) => {
    setOnBreak(true);
    setPlaying(false);
    playingRef.current = false;
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
    startCountdown(breakSeconds, () => {
      if (currentCycle < totalCycles) {
        startPlaySegment(currentCycle + 1);
      } else {
        setOnBreak(false);
        setHasStarted(false);
        setCountdown(0);
        clearTimer();
        setScreen('end');
      }
    });
  };

  const startBreakBetweenVideos = (nextVideoId) => {
    setOnBreak(true);
    setPlaying(false);
    playingRef.current = false;
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
    startCountdown(breakSeconds, () => {
      setOnBreak(false);
      setPlaying(true);
      setHasStarted(true);
      setActiveVideoId(nextVideoId);
      if (playerRef.current) {
        playerRef.current.loadVideoById({ videoId: nextVideoId, startSeconds: 0 });
        playWithoutMute();
      }
    });
  };

  const startPlayback = () => {
    const trimmedIds = normalizeVideoIds(videoIds);
    const uniqueIds = Array.from(new Set(trimmedIds));
    if (trimmedIds.length === 0) {
      setVideoIdError('Please enter at least one YouTube video ID.');
      return;
    }
    if (uniqueIds.length !== trimmedIds.length) {
      setVideoIdError('Duplicate YouTube video IDs are not allowed.');
      return;
    }
    setVideoIdError('');
    setVideoIds(uniqueIds);
    const safeCycles = Math.max(1, Math.floor(totalCycles));
    const safePlay = Math.max(0, Math.floor(playSeconds));
    const safeBreak = Math.max(0, Math.floor(breakSeconds));
    setTotalCycles(safeCycles);
    setPlaySeconds(safePlay);
    setBreakSeconds(safeBreak);
    requestFullscreen();
    setPlaying(false);
    setOnBreak(false);
    setHasStarted(false);
    setScreen('intro');
  };

  const onReady = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    if (playingRef.current) {
      playerRef.current.playVideo();
    } 
  };

  const onStateChange = (event) => {
    if (!playerRef.current || onBreak || !hasStarted) {
      return;
    }
    const playerState = window.YT?.PlayerState;
    if (!playerState) {
      return;
    }
    if (event.data === playerState.CUED || event.data === playerState.PAUSED) {
      playerRef.current.playVideo();
    }
  };

  const handleVideoEnd = () => {
    if (!hasStarted) {
      return;
    }
    const trimmedIds = normalizeVideoIds(videoIds);
    const currentIndex = trimmedIds.indexOf(activeVideoId);
    const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
    if (nextIndex < trimmedIds.length && countdown > 0) {
      const nextId = trimmedIds[nextIndex];
      if (currentIndex === 0 && breakSeconds > 0) {
        startBreakBetweenVideos(nextId);
        return;
      }
      setActiveVideoId(nextId);
      if (playerRef.current) {
        playerRef.current.loadVideoById({ videoId: nextId, startSeconds: 0 });
        playWithoutMute();
      }
      return;
    }
    clearTimer();
    setPlaying(false);
    setOnBreak(false);
    setHasStarted(false);
    setCountdown(0);
    setScreen('end');
  };

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
      setPlaylists([]);
      setPlaylistVideos([]);
      setPlaylistVideosToken('');
      setActivePlaylistId('');
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  const handleFetchPlaylists = async () => {
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

  const resolvePlaylistId = (playlist) =>
    playlist?.playlistId || playlist?.id || playlist?.snippet?.playlistId || '';

  const handleFetchPlaylistVideos = async (playlistId, pageToken = '') => {
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
      <div>
        {user ? (
          <div>
            <span>Logged in as {user.displayName || user.email || 'Google user'}</span>
            <button onClick={handleLogout}>Log out</button>
            <button onClick={handleFetchPlaylists} disabled={isLoadingPlaylists}>
              {isLoadingPlaylists ? 'Loading playlists...' : 'Load YouTube Playlists'}
            </button>
          </div>
        ) : (
          <button onClick={handleLogin}>Sign in with Google</button>
        )}
      </div>
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
                    onClick={() => handleFetchPlaylistVideos(playlistId)}
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
                    onClick={() => handleAddVideoId(video.videoId)}
                    style={{ cursor: 'pointer' }}
                  />
                )}
                <div>{video.title || 'Untitled video'}</div>
                {!!video.videoId && (
                  <button onClick={() => handleAddVideoId(video.videoId)}>
                    Add to list
                  </button>
                )}
              </div>
            ))}
          </div>
          {playlistVideosToken && (
            <button
              onClick={() => handleFetchPlaylistVideos(activePlaylistId, playlistVideosToken)}
              disabled={isLoadingVideos}
            >
              {isLoadingVideos ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
      {!playing && !onBreak && screen === 'player' && (
        <div>
          <p>YouTube Video IDs</p>
          {videoIds.map((id, index) => (
            <div key={`video-id-${index}`}>
              <input
                placeholder={`YouTube Video ID ${index + 1}`}
                value={id}
                onChange={e => {
                  const nextIds = [...videoIds];
                  nextIds[index] = e.target.value;
                  setVideoIds(nextIds);
                  if (videoIdError) {
                    setVideoIdError('');
                  }
                }}
              />
              {videoIds.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const nextIds = videoIds.filter((_, i) => i !== index);
                    setVideoIds(nextIds.length ? nextIds : ['']);
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setVideoIds([...videoIds, ''])}
          >
            Add another video
          </button>
          {!!videoIdError && <div>{videoIdError}</div>}
          <br></br>
          <p>Play Seconds</p>
          <input
            type="number"
            placeholder="Seconds"
            value={playSeconds}
            onChange={e => setPlaySeconds(Number(e.target.value))}
          />
          <br></br>
          <p>Break Seconds</p>
          <input
            type="number"
            placeholder="Break seconds"
            value={breakSeconds}
            onChange={e => setBreakSeconds(Number(e.target.value))}
          />
          <br></br>
          <p>Total Cycles</p>
          <input
            type="number"
            placeholder="Cycles"
            value={totalCycles}
            onChange={e => setTotalCycles(Number(e.target.value))}
          />
          <button onClick={startPlayback}>Start</button>
        </div>
      )}

      {!!activeVideoId && (
        <div className={videoContainerClass}>
          <YouTube
            videoId={activeVideoId}
            opts={{...opts, iframeAttrs: {allowFullScreen: true}}}
            onReady={onReady}
            onEnd={handleVideoEnd}
            onStateChange={onStateChange}
          />
          {playing && <div className="timer">Time left: {countdown}s (Cycle {cycleIndex}/{totalCycles})</div>}
        </div>
      )}

      {onBreak && (
        <div className="break-video">
          <video src={breakVideo} autoPlay loop muted />
          <div className="break-video__caption">
            <h1>Break Time</h1>
            <p>Back in {countdown}s</p>
            <p>Cycle {cycleIndex} of {totalCycles}</p>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
