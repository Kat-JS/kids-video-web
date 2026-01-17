import React, { useState, useEffect, useRef } from 'react';
import { synthesizeSpeech } from './googleTts';

export default function TruckExperience({ customMessage, videoPaths, onComplete, autoStart = true }) {
  // States: 'LOCKED', 'IDLE', 'TALKING', 'DRIVING'
  const [status, setStatus] = useState('LOCKED');
  const [ttsError, setTtsError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const drivingRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const hasCompletedRef = useRef(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (status !== 'DRIVING' || !drivingRef.current) {
      return;
    }

    const drivingVideo = drivingRef.current;
    drivingVideo.currentTime = 0;
    const playAttempt = drivingVideo.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {});
    }

    if (typeof onComplete === 'function' && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete();
    }
  }, [status, onComplete]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (autoStart && status === 'LOCKED' && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startCinematic();
    }
  }, [autoStart, status]);

  const startCinematic = () => {
    // 1. Set to IDLE first
    setStatus('IDLE');
    setTtsError('');
    hasCompletedRef.current = false;
    hasStartedRef.current = true;

    const playBrowserTts = () => {
      if (!customMessage || !customMessage.trim()) {
        setTtsError('Message is empty.');
        return;
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(customMessage.trim());
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      utterance.onstart = () =>  { setStatus('TALKING'), console.log('Playing browser TTS...'); };
      utterance.onend = () => { setStatus('DRIVING'), console.log('Browser TTS ended.'); };
      window.speechSynthesis.speak(utterance);
    };

    const playTts = async () => {
      if (!customMessage || !customMessage.trim()) {
        setTtsError('Message is empty.');
        return;
      }
      setIsGenerating(true);
      try {
        const audioUrl = await synthesizeSpeech(customMessage.trim());
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        audioUrlRef.current = audioUrl;

        const audio = audioRef.current || new Audio();
        audioRef.current = audio;
        audio.src = audioUrl;
        audio.onplay = () => setStatus('TALKING');
        audio.onended = () => setStatus('DRIVING');
        audio.onerror = () => {
          setTtsError('Audio playback failed.');
          setStatus('IDLE');
        };
        await audio.play();
      } catch (error) {
        setTtsError('AWS TTS failed. Falling back to browser voice.');
        setStatus('IDLE');
        console.error('AWS TTS Error:', error);
        playBrowserTts();
      } finally {
        setIsGenerating(false);
      }
    };

    playTts();
  };

  return (
    <div style={containerStyle}>
      {/* --- PRE-LOADED VIDEO LAYERS --- */}
      
      {/* IDLE (Background) */}
      <video src={videoPaths.idle} autoPlay loop muted style={{...vStyle, opacity: status !== 'LOCKED' ? 1 : 0}} />

      {/* TALKING (Overlay) */}
      <video src={videoPaths.talking} autoPlay loop muted style={{...vStyle, opacity: status === 'TALKING' ? 1 : 0}} />

      {/* DRIVING (Top Layer) */}
      <video ref={drivingRef} src={videoPaths.driving} muted style={{...vStyle, opacity: status === 'DRIVING' ? 1 : 0}} />

      {/* --- UI OVERLAYS --- */}

      {status === 'LOCKED' && !autoStart && (
        <div style={overlayStyle}>
          <div style={overlayInnerStyle}>
            <button onClick={startCinematic} style={buttonStyle} disabled={isGenerating}>
              {isGenerating ? 'GENERATING AUDIO...' : 'PLAY VIDEO'}
            </button>
            {ttsError && <div style={errorStyle}>{ttsError}</div>}
          </div>
        </div>
      )}

      {status === 'TALKING' && (
        <div style={subtitleStyle}>
          "{customMessage}"
        </div>
      )}

      {/* Cinematic Vignette */}
      <div style={vignetteStyle} />
    </div>
  );
}

// --- Styles ---
const vStyle = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.6s ease' };
const containerStyle = { position: 'relative', width: '100%', height: '100%', background: 'black', overflow: 'hidden' };
const overlayStyle = { position: 'absolute', zIndex: 10, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.8)' };
const overlayInnerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' };
const buttonStyle = { padding: '15px 40px', fontSize: '20px', cursor: 'pointer', backgroundColor: '#f0a500', border: 'none', fontWeight: 'bold' };
const subtitleStyle = { position: 'absolute', bottom: '10%', width: '100%', textAlign: 'center', color: 'white', fontSize: '2rem', zIndex: 5, textShadow: '2px 2px 8px black' };
const vignetteStyle = { position: 'absolute', width: '100%', height: '100%', boxShadow: 'inset 0 0 200px rgba(0,0,0,0.9)', pointerEvents: 'none', zIndex: 4 };
const errorStyle = { color: '#ffb3b3', fontSize: '0.95rem', textAlign: 'center', maxWidth: '70vw' };
