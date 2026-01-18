import React from 'react';
import YouTube from 'react-youtube';

const PlayerStage = ({
  activeVideoId,
  videoContainerClass,
  opts,
  onReady,
  onEnd,
  onStateChange,
  playing,
  countdown,
  cycleIndex,
  totalCycles,
  onBreak,
  breakVideo,
}) => (
  <>
    {!!activeVideoId && (
      <div className={videoContainerClass}>
        <YouTube
          videoId={activeVideoId}
          opts={{ ...opts, iframeAttrs: { allowFullScreen: true } }}
          onReady={onReady}
          onEnd={onEnd}
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
  </>
);

export default PlayerStage;
