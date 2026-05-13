'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, ShieldAlert, EyeOff } from 'lucide-react';
import { Slider } from '../ui/slider';
import { addListener, launch, stop } from 'devtools-detector';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  userIdentifier?: string;
}

export function VideoPlayer({ src, poster, title, className = '', userIdentifier }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isSecureMode, setIsSecureMode] = useState(true);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState({ x: 10, y: 10 });
  const [error, setError] = useState<string | null>(null);
  const [isBlurry, setIsBlurry] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watermarkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / dur) * 100);
    }
  };

  const handleProgressChange = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress(value[0]);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVol = value[0];
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setVolume(newVol);
      setIsMuted(newVol === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (container) container.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // --- SECURITY FEATURES ---
  useEffect(() => {
    // 1. Watermark Movement
    watermarkIntervalRef.current = setInterval(() => {
      setWatermarkPos({
        x: Math.random() * 80 + 10, // 10% to 90%
        y: Math.random() * 80 + 10,
      });
    }, 8000);

    // 2. DevTools Detection
    addListener((isOpen) => {
      setIsDevToolsOpen(isOpen);
      if (isOpen && isPlaying) {
        videoRef.current?.pause();
      }
    });
    launch();

    // 3. Tab Visibility
    const handleVisibilityChange = () => {
      const hidden = document.hidden;
      setIsTabHidden(hidden);
      if (hidden && isPlaying) {
        videoRef.current?.pause();
      }
    };

    // 4. Keyboard Shortcuts Deterrence
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Block PrintScreen and common capture keys
      if (['PrintScreen', 'F12', 'F11', 'Snapshot'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 2. Block common screenshot shortcuts (Cmd+Shift+3/4 on Mac, Win+Shift+S on Windows)
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;
      
      // Cmd+Shift+3/4/5 (Mac) or Ctrl+P (Print) or Ctrl+S (Save)
      if (
        (isCmdOrCtrl && (isShift || e.key === 'p' || e.key === 's')) ||
        (isCmdOrCtrl && isAlt && e.key === 'i') || // Mac DevTools
        (isCmdOrCtrl && isShift && e.key === 'i') || // Win DevTools
        ['PrintScreen', 'Snapshot'].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent default action
        e.preventDefault();
        e.stopPropagation();
        
        // Trigger blur deterrent for keyboard captures
        setIsBlurry(true);
        videoRef.current?.pause();
        setIsPlaying(false);
        setTimeout(() => setIsBlurry(false), 3000);
        
        return false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown, true); // Capture phase focus guard

    // 5. Removed YouTube warning as we now support it via iframe fallback
    // setError(null);

    return () => {
      if (watermarkIntervalRef.current) clearInterval(watermarkIntervalRef.current);
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isPlaying]);

  const getEmbedInfo = (url: string) => {
    // YouTube
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[2].length === 11) {
      return { type: 'youtube', url: `https://www.youtube.com/embed/${ytMatch[2]}?autoplay=0&controls=1&rel=0&modestbranding=1&fs=0` };
    }

    // Google Drive
    const gdRegExp = /drive\.google\.com\/file\/d\/([^\/\?]+)/;
    const gdMatch = url.match(gdRegExp);
    if (gdMatch) {
      return { type: 'drive', url: `https://drive.google.com/file/d/${gdMatch[1]}/preview?fs=0` };
    }

    return { type: 'direct', url };
  };

  const embedInfo = getEmbedInfo(src);

  return (
    <div
      ref={containerRef}
      className={`relative group overflow-hidden rounded-2xl bg-black border border-border shadow-2xl aspect-video select-none ${className}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Visibility Guard / DevTools Alert / Error State */}
      <AnimatePresence>
        {(isDevToolsOpen || isTabHidden || error) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl p-8 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-brand-red/10 flex items-center justify-center mb-6 animate-pulse">
              {error ? <ShieldAlert className="h-10 w-10 text-brand-red" /> : isDevToolsOpen ? <ShieldAlert className="h-10 w-10 text-brand-red" /> : <EyeOff className="h-10 w-10 text-brand-gold" />}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {error ? "Playback Error" : isDevToolsOpen ? "Security Alert: Inspect Tool Detected" : "Playback Paused"}
            </h2>
            <p className="text-muted-foreground max-w-sm">
              {error 
                ? error 
                : isDevToolsOpen 
                  ? "Unauthorized debugging tools are active. Please close Developer Tools to resume playback." 
                  : "Playback was paused because the tab lost focus. Click play to resume."}
            </p>
            {error && (
              <button 
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-brand-red text-white rounded-lg font-bold hover:bg-brand-red/90 transition-colors"
              >
                Retry Loading
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Repeating Grid Watermark */}
      {userIdentifier && (
        <div className="absolute inset-0 z-[80] pointer-events-none opacity-[0.06] overflow-hidden flex flex-wrap gap-x-16 gap-y-12 p-8">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 -rotate-12 whitespace-nowrap">
              <EyeOff className="h-3 w-3" />
              <span className="text-[9px] font-mono font-bold tracking-tighter uppercase">{userIdentifier}</span>
            </div>
          ))}
        </div>
      )}

      {/* Persistent Floating Watermark */}
      {userIdentifier && (
        <motion.div
          animate={{ 
            left: `${watermarkPos.x}%`, 
            top: `${watermarkPos.y}%`
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute z-[100] pointer-events-none opacity-40 text-[10px] sm:text-xs font-mono text-white bg-black/60 px-3 py-2 rounded-full backdrop-blur-md border border-white/20 whitespace-nowrap shadow-2xl flex items-center gap-3"
        >
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-red/20 rounded-full border border-brand-red/30 h-6">
            <EyeOff className="h-3 w-3 text-brand-red" />
            <span className="text-brand-red font-bold tracking-tighter uppercase text-[9px] leading-none">Secure View</span>
          </div>
          <div className="flex items-center text-white/90 leading-none h-6">
            <span>{userIdentifier}</span>
          </div>
        </motion.div>
      )}

      {embedInfo.type !== 'direct' ? (
        <iframe
          src={embedInfo.url}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || "External video player"}
        />
      ) : (
        <>
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            aria-label={title || 'Video player'}
            className="w-full h-full object-contain"
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => {
              setDuration(videoRef.current?.duration || 0);
              setError(null);
            }}
            onError={() => setError("The video could not be loaded. Please check the source URL or your internet connection.")}
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Play Overlay */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10 pointer-events-none"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 rounded-full bg-brand-red/90 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.5)] border border-white/20"
                >
                  <Play className="h-10 w-10 text-white fill-current ml-1" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom Controls */}
          <motion.div
            animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
            className="absolute bottom-0 inset-x-0 p-4 pt-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none"
          >
            <div className="pointer-events-auto space-y-4">
              {/* Progress Bar */}
              <div className="px-2">
                <Slider
                  value={[progress]}
                  max={100}
                  step={0.1}
                  onValueChange={handleProgressChange}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-5">
                  <button onClick={togglePlay} className="text-white hover:text-brand-red transition-colors">
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
                  </button>

                  <div className="hidden sm:flex items-center gap-2">
                    <button onClick={() => skip(-10)} className="text-white/70 hover:text-white"><RotateCcw className="h-4 w-4" /></button>
                    <button onClick={() => skip(10)} className="text-white/70 hover:text-white"><RotateCw className="h-4 w-4" /></button>
                  </div>

                  <div className="flex items-center gap-2 group/volume">
                    <button onClick={toggleMute} className="text-white hover:text-brand-gold transition-colors">
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="w-20 h-1"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] sm:text-xs font-mono text-white/80 select-none">
                    {formatTime(currentTime)} <span className="text-white/30">/</span> {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {title && <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20">{title}</span>}
                  <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                    <Maximize className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Floating Controls for Embeds (YouTube/Drive) */}
      {embedInfo.type !== 'direct' && (
        <div className="absolute bottom-4 right-4 z-[110] opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={toggleFullscreen} 
            className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-brand-red transition-all shadow-xl"
            title="Toggle Secure Fullscreen"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
