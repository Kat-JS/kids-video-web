import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import './App.css';
import TruckExperience from './truckStateMachine.jsx';
function App() {
  const assets = {
    idle: "/truck_idle.mp4",
    talking: "/truck_talking.mp4",
    driving: "/truck_driving.mp4"
  };
  const breakVideo = "/truck_sleep.mp4";
  const [videoId, setVideoId] = useState('');
  const [playSeconds, setPlaySeconds] = useState(20);
  const [breakSeconds, setBreakSeconds] = useState(10);
  const [totalCycles, setTotalCycles] = useState(1);
  const [cycleIndex, setCycleIndex] = useState(1);
  const [playing, setPlaying] = useState(false);
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

  const startPlayback = () => {
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
    } else {
      playerRef.current.pauseVideo();
    }
  };

  const handleVideoEnd = () => {
    if (!hasStarted) {
      return;
    }
    clearTimer();
    setPlaying(false);
    setOnBreak(false);
    setHasStarted(false);
    setCountdown(0);
    setScreen('end');
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

  const introMessage = "Yay! Let's watch the video. Get cozy and ready!";
  const endMessage = "Bye-bye! I need a break to fuel up and get my energy back. See you soon!";

  if (screen === 'end') {
    return (
      <TruckExperience
        customMessage={endMessage}
        videoPaths={assets}
      />
    );
  }

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

  return (
    <div className="App" ref={appRef}>
      {!playing && !onBreak && screen === 'player' && (
        <div>
          <p>YouTube Video ID</p>
          <input
            placeholder="YouTube Video ID"
            value={videoId}
            onChange={e => setVideoId(e.target.value)}
          />
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

      {hasStarted && !!videoId && (
        <div className={`video-container ${playing ? 'is-playing' : 'is-paused'}`}>
          <YouTube
            videoId={videoId}
            opts={{...opts, iframeAttrs: {allowFullScreen: true}}}
            onReady={onReady}
            onEnd={handleVideoEnd}
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
