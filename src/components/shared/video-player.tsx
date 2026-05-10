'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw } from 'lucide-react';
import { Slider } from '../ui/slider';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
}

export function VideoPlayer({ src, poster, title, className = '' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  return (
    <div
      ref={containerRef}
      className={`relative group overflow-hidden rounded-2xl bg-black border border-border shadow-2xl aspect-video ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        aria-label={title || 'Video player'}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Overlays */}
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
    </div>
  );
}
