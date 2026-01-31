import React from 'react';

const PlaybackControls = ({
  videoIds,
  videoIdError,
  playSeconds,
  breakSeconds,
  totalCycles,
  introMessage,
  endMessage,
  ttsLanguage,
  introPlaceholder,
  endPlaceholder,
  ttsLanguagePlaceholder,
  onChangeVideoId,
  onRemoveVideoId,
  onAddVideoInput,
  onStartPlayback,
  onSetIntroMessage,
  onSetEndMessage,
  onSetTtsLanguage,
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
    <p>Intro Message</p>
    <textarea
      placeholder={introPlaceholder}
      value={introMessage}
      onChange={e => onSetIntroMessage(e.target.value)}
      rows={3}
    />
    <br />
    <p>End Message</p>
    <textarea
      placeholder={endPlaceholder}
      value={endMessage}
      onChange={e => onSetEndMessage(e.target.value)}
      rows={3}
    />
    <br />
    <p>TTS Language</p>
    <select
      value={ttsLanguage || ttsLanguagePlaceholder}
      onChange={e => onSetTtsLanguage(e.target.value)}
    >
      <option value="en-US">English (US)</option>
      <option value="en-GB">English (UK)</option>
      <option value="es-ES">Spanish (ES)</option>
      <option value="es-MX">Spanish (MX)</option>
      <option value="fr-FR">French</option>
      <option value="de-DE">German</option>
      <option value="it-IT">Italian</option>
      <option value="pt-BR">Portuguese (BR)</option>
      <option value="ja-JP">Japanese</option>
      <option value="ko-KR">Korean</option>
      <option value="zh-CN">Chinese (Simplified)</option>
      <option value="zh-TW">Chinese (Traditional)</option>
    </select>
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
