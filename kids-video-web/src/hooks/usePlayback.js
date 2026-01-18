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
  const playingRef = useRef(false);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
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
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
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
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
    setOnBreak(false);
    setHasStarted(false);
    setCountdown(0);
    setScreen('end');
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
