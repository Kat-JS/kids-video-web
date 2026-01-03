import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import './App.css';

function App() {
  const [videoId, setVideoId] = useState('');
  const [playMinutes, setPlayMinutes] = useState(1);
  const [breakMinutes, setBreakMinutes] = useState(1);
  const [totalCycles, setTotalCycles] = useState(1);
  const [cycleIndex, setCycleIndex] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const playingRef = useRef(false);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

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
    setCycleIndex(nextCycleIndex);
    setOnBreak(false);
    setPlaying(true);
    setHasStarted(true);
    playingRef.current = true;
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
    startCountdown(playMinutes * 60, () => {
      if (breakMinutes > 0) {
        startBreakSegment(nextCycleIndex);
      } else if (nextCycleIndex < totalCycles) {
        startPlaySegment(nextCycleIndex + 1);
      } else {
        setPlaying(false);
        setHasStarted(false);
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
    startCountdown(breakMinutes * 60, () => {
      if (currentCycle < totalCycles) {
        startPlaySegment(currentCycle + 1);
      } else {
        setOnBreak(false);
        setHasStarted(false);
      }
    });
  };

  const startPlayback = () => {
    const safeCycles = Math.max(1, Math.floor(totalCycles));
    const safePlay = Math.max(0, Math.floor(playMinutes));
    const safeBreak = Math.max(0, Math.floor(breakMinutes));
    setTotalCycles(safeCycles);
    setPlayMinutes(safePlay);
    setBreakMinutes(safeBreak);
    startPlaySegment(1);
  };

  const onReady = (event) => {
    playerRef.current = event.target;
    if (playingRef.current) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
    },
  };

  return (
    <div className="App">
      {!playing && !onBreak && (
        <div>
          <p>YouTube Video ID</p>
          <input
            placeholder="YouTube Video ID"
            value={videoId}
            onChange={e => setVideoId(e.target.value)}
          />
          <br></br>
          <p>Play Minutes</p>
          <input
            type="number"
            placeholder="Minutes"
            value={playMinutes}
            onChange={e => setPlayMinutes(Number(e.target.value))}
          />
          <br></br>
          <p>Break Minutes</p>
          <input
            type="number"
            placeholder="Break minutes"
            value={breakMinutes}
            onChange={e => setBreakMinutes(Number(e.target.value))}
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

      {hasStarted && !!videoId && (
        <div className={`video-container ${playing ? 'is-playing' : 'is-paused'}`}>
          <YouTube videoId={videoId} opts={{...opts, iframeAttrs: {allowFullScreen: true}}} onReady={onReady} />
          {playing && <div className="timer">Time left: {countdown}s (Cycle {cycleIndex}/{totalCycles})</div>}
        </div>
      )}

      {onBreak && (
        <div className="break-overlay">
          <h1>Break Time!</h1>
          <p>Countdown: {countdown}s</p>
          <p>Cycle {cycleIndex} of {totalCycles}</p>
        </div>
      )}
    </div>
  );
}

export default App;
