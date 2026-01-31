import { useEffect, useRef, useState } from 'react';

const normalizeVideoIds = (ids) =>
  ids.map(id => id.trim()).filter(Boolean);

const usePlayback = () => {
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
  const playerRef = useRef(null);
  const appRef = useRef(null);
  const timerRef = useRef(null);
  const breakDelayRef = useRef(null);
  const endDelayRef = useRef(null);
  const volumeFadeRef = useRef(null);
  const endCheckRef = useRef(null);
  const endTransitionedRef = useRef(false);
  const volumeRef = useRef(100);
  const playingRef = useRef(false);
  const activeVideoIdRef = useRef('');
  const countdownRef = useRef(0);
  const suppressAutoPlayRef = useRef(false);
  const breakDelayMs = 5000;
  const endDelayMs = 5000;
  const endLeadSeconds = Math.ceil(endDelayMs / 1000);
  const endCheckIntervalMs = 250;

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    activeVideoIdRef.current = activeVideoId;
  }, [activeVideoId]);

  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (breakDelayRef.current) {
        clearTimeout(breakDelayRef.current);
        breakDelayRef.current = null;
      }
      if (endDelayRef.current) {
        clearTimeout(endDelayRef.current);
        endDelayRef.current = null;
      }
      if (volumeFadeRef.current) {
        clearInterval(volumeFadeRef.current);
        volumeFadeRef.current = null;
      }
      if (endCheckRef.current) {
        clearInterval(endCheckRef.current);
        endCheckRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.stopVideo();
      }
    };
  }, []);

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

  const startFadeOutVolume = (durationMs) => {
    if (!playerRef.current || !playerRef.current.getVolume || !playerRef.current.setVolume) {
      return;
    }
    const startVolume = playerRef.current.getVolume();
    volumeRef.current = Number.isFinite(startVolume) ? startVolume : volumeRef.current;
    if (volumeFadeRef.current) {
      clearInterval(volumeFadeRef.current);
    }
    const steps = Math.max(1, Math.floor(durationMs / 100));
    const stepMs = Math.max(50, Math.floor(durationMs / steps));
    let step = 0;
    volumeFadeRef.current = setInterval(() => {
      step += 1;
      const nextVolume = Math.max(0, Math.round(volumeRef.current * (1 - step / steps)));
      playerRef.current.setVolume(nextVolume);
      if (step >= steps) {
        clearInterval(volumeFadeRef.current);
        volumeFadeRef.current = null;
      }
    }, stepMs);
  };

  const shouldTransitionToEnd = () => {
    const trimmedIds = normalizeVideoIds(videoIds);
    const currentId = activeVideoIdRef.current || activeVideoId;
    const currentIndex = trimmedIds.indexOf(currentId);
    const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
    return !(nextIndex < trimmedIds.length && countdownRef.current > 0);
  };

  const clearEndCheck = () => {
    if (endCheckRef.current) {
      clearInterval(endCheckRef.current);
      endCheckRef.current = null;
    }
  };

  const startEndCheck = () => {
    console.log('[usePlayback] startEndCheck called', {
      hasPlayer: Boolean(playerRef.current),
      hasGetDuration: Boolean(playerRef.current?.getDuration),
    });
    if (!playerRef.current || !playerRef.current.getDuration) {
      return;
    }
    clearEndCheck();
    endCheckRef.current = setInterval(() => {
      console.log('[usePlayback] endCheck tick', {
        hasStarted,
        onBreak,
        endTransitioned: endTransitionedRef.current,
      });
      if (!playerRef.current || endTransitionedRef.current || onBreak || !hasStarted) {
        return;
      }
      if (!shouldTransitionToEnd()) {
        console.log('[usePlayback] endCheck skip: shouldTransitionToEnd=false');
        return;
      }
      const duration = playerRef.current.getDuration();
      const currentTime = playerRef.current.getCurrentTime?.();
      console.log('[usePlayback] duration:', duration);
      console.log('[usePlayback] currentTime:', currentTime);
      if (!Number.isFinite(duration) || !Number.isFinite(currentTime) || duration <= 0) {
        console.log('[usePlayback] endCheck skip: invalid duration/currentTime', {
          duration,
          currentTime,
        });
        return;
      }
      const remaining = duration - currentTime;
      console.log('[usePlayback] remaining seconds:', remaining);
      if (remaining <= endLeadSeconds) {
        console.log('[usePlayback] endCheck trigger transitionToEnd');
        endTransitionedRef.current = true;
        clearEndCheck();
        transitionToEnd();
      }
    }, endCheckIntervalMs);
  };

  useEffect(() => {
    if (playerReady && hasStarted && playing && !onBreak) {
      startEndCheck();
    } else {
      clearEndCheck();
    }
  }, [playerReady, hasStarted, playing, onBreak]);

  const transitionToEnd = () => {
    setPlaying(false);
    playingRef.current = false;
    setOnBreak(false);
    setCountdown(0);
    startFadeOutVolume(endDelayMs);
    clearEndCheck();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (endDelayRef.current) {
      clearTimeout(endDelayRef.current);
    }
    endDelayRef.current = setTimeout(() => {
      suppressAutoPlayRef.current = true;
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
      setHasStarted(false);
      setScreen('end');
    }, endDelayMs);
  };

  const startCountdown = (seconds, onDone) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
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
    const resolvedVideoId = (activeVideoIdRef.current && normalizedIds.includes(activeVideoIdRef.current))
      ? activeVideoIdRef.current
      : normalizedIds[0];
    setCycleIndex(nextCycleIndex);
    setOnBreak(false);
    setPlaying(true);
    setHasStarted(true);
    suppressAutoPlayRef.current = false;
    endTransitionedRef.current = false;
//    activeVideoIdRef.current = resolvedVideoId;
    setActiveVideoId(resolvedVideoId);
    playingRef.current = true;
    if (playerRef.current) {
      if (playerRef.current.setVolume) {
        playerRef.current.setVolume(volumeRef.current);
      }
      playWithoutMute();
    }
    startCountdown(playSeconds, () => {
      if (breakSeconds > 0 && nextCycleIndex < totalCycles) {
        startBreakSegment(nextCycleIndex);
      } else if (nextCycleIndex < totalCycles) {
        startPlaySegment(nextCycleIndex + 1);
      } else {
        transitionToEnd();
      }
    });
  };

  const startBreakSegment = (currentCycle) => {
    setPlaying(false);
    playingRef.current = false;
    startFadeOutVolume(breakDelayMs);
    clearEndCheck();
    if (breakDelayRef.current) {
      clearTimeout(breakDelayRef.current);
    }
    breakDelayRef.current = setTimeout(() => {
      suppressAutoPlayRef.current = true;
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
      setOnBreak(true);
      startCountdown(breakSeconds, () => {
        if (currentCycle < totalCycles) {
          startPlaySegment(currentCycle + 1);
        } else {
          transitionToEnd();
        }
      });
    }, breakDelayMs);
  };

  const startBreakBetweenVideos = (cycleIndex, nextVideoId) => {
    setPlaying(false);
    playingRef.current = false;
    startFadeOutVolume(breakDelayMs);
    clearEndCheck();
    if (breakDelayRef.current) {
      clearTimeout(breakDelayRef.current);
    }
    breakDelayRef.current = setTimeout(() => {
      suppressAutoPlayRef.current = true;
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
      setOnBreak(true);
      startCountdown(breakSeconds, () => {
        setOnBreak(false);
        setPlaying(true);
        setHasStarted(true);
        activeVideoIdRef.current = nextVideoId;
        setActiveVideoId(nextVideoId);
        suppressAutoPlayRef.current = false;
        // if (playerRef.current) {
        //   playerRef.current.loadVideoById({ videoId: nextVideoId, startSeconds: 0 });
        //   playWithoutMute();
        // }
        startPlaySegment(cycleIndex);
      });
    }, breakDelayMs);
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
    if (playerRef.current?.getVolume) {
      const currentVolume = playerRef.current.getVolume();
      if (Number.isFinite(currentVolume)) {
        volumeRef.current = currentVolume;
      }
    }
    if (playingRef.current) {
      playerRef.current.playVideo();
    }
  };

  const onStateChange = (event) => {
    if (!playerRef.current || onBreak || !hasStarted) {
      return;
    }
    if (suppressAutoPlayRef.current) {
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
    const currentId = activeVideoIdRef.current || activeVideoId;
    const currentIndex = trimmedIds.indexOf(currentId);
    const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
    if (nextIndex < trimmedIds.length && countdown > 0) {
      const nextId = trimmedIds[nextIndex];
      if (currentIndex === 0 && breakSeconds > 0) {
        startBreakBetweenVideos(cycleIndex + 1, nextId);
        return;
      }
      activeVideoIdRef.current = nextId;
      setActiveVideoId(nextId);
      startPlaySegment(cycleIndex + 1);
      return;
    }
    if (endTransitionedRef.current) {
      return;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    transitionToEnd();
  };

  return {
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
    playerReady,
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
  };
};

export default usePlayback;
