'use client';

import * as React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BackgroundFAB() {
  const [bgUrl, setBgUrl] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    try {
      const savedBg = localStorage.getItem('focus_bg');
      if (savedBg) {
        setBgUrl(savedBg);
      }
    } catch (err) {
      console.warn('Failed to read from localStorage', err);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      setBgUrl(dataUri);
      try {
        localStorage.setItem('focus_bg', dataUri);
      } catch (err) {
        console.warn('Failed to save to localStorage, it might be too large', err);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <AnimatePresence>
        {bgUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{ backgroundImage: `url(${bgUrl})` }}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 right-6 z-50 pointer-events-auto">
        <motion.label 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="cursor-pointer flex items-center justify-center w-12 h-12 bg-black/40 backdrop-blur-2xl border border-white/20 rounded-full shadow-lg group overflow-hidden"
          title="Change Background"
        >
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-5 h-5 border-2 border-white/70 border-t-transparent rounded-full animate-spin"
              />
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ImageIcon className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange} 
          />
        </motion.label>
      </div>
    </>
  );
}
