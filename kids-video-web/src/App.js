import React, { useState, useRef } from 'react';
import YouTube from 'react-youtube';
import './App.css';

function App() {
  const [videoId, setVideoId] = useState('');
  const [playMinutes, setPlayMinutes] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const playerRef = useRef(null);

  const startPlayback = () => {
    setPlaying(true);
    setOnBreak(false);
    setCountdown(playMinutes * 60);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setOnBreak(true);
          setPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onReady = (event) => {
    playerRef.current = event.target;
    // Optionally autoplay
    playerRef.current.playVideo();
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
          <input
            placeholder="YouTube Video ID"
            value={videoId}
            onChange={e => setVideoId(e.target.value)}
          />
          <input
            type="number"
            placeholder="Minutes"
            value={playMinutes}
            onChange={e => setPlayMinutes(Number(e.target.value))}
          />
          <button onClick={startPlayback}>Start</button>
        </div>
      )}

      {playing && (
        <div className="video-container">
          <YouTube videoId={videoId} opts={{...opts, iframeAttrs: {allowFullScreen: true}}} onReady={onReady} />
          <div className="timer">Time left: {countdown}s</div>
        </div>
      )}

      {onBreak && (
        <div className="break-overlay">
          <h1>Break Time!</h1>
          <p>Countdown: {countdown}</p>
        </div>
      )}
    </div>
  );
}

export default App;
