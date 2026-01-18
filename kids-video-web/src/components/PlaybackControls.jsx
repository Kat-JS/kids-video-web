import React from 'react';

const PlaybackControls = ({
  videoIds,
  videoIdError,
  playSeconds,
  breakSeconds,
  totalCycles,
  onChangeVideoId,
  onRemoveVideoId,
  onAddVideoInput,
  onStartPlayback,
  onSetPlaySeconds,
  onSetBreakSeconds,
  onSetTotalCycles,
}) => (
  <div>
    <p>YouTube Video IDs</p>
    {videoIds.map((id, index) => (
      <div key={`video-id-${index}`}>
        <input
          placeholder={`YouTube Video ID ${index + 1}`}
          value={id}
          onChange={e => onChangeVideoId(index, e.target.value)}
        />
        {videoIds.length > 1 && (
          <button
            type="button"
            onClick={() => onRemoveVideoId(index)}
          >
            Remove
          </button>
        )}
      </div>
    ))}
    <button
      type="button"
      onClick={onAddVideoInput}
    >
      Add another video
    </button>
    {!!videoIdError && <div>{videoIdError}</div>}
    <br />
    <p>Play Seconds</p>
    <input
      type="number"
      placeholder="Seconds"
      value={playSeconds}
      onChange={e => onSetPlaySeconds(Number(e.target.value))}
    />
    <br />
    <p>Break Seconds</p>
    <input
      type="number"
      placeholder="Break seconds"
      value={breakSeconds}
      onChange={e => onSetBreakSeconds(Number(e.target.value))}
    />
    <br />
    <p>Total Cycles</p>
    <input
      type="number"
      placeholder="Cycles"
      value={totalCycles}
      onChange={e => onSetTotalCycles(Number(e.target.value))}
    />
    <button onClick={onStartPlayback}>Start</button>
  </div>
);

export default PlaybackControls;
