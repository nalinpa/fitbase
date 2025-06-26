import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from './ui/Button';

interface RestTimerModalProps {
  isOpen: boolean;
  restTime: number; // The total rest time in seconds
  onClose: () => void;
}

export default function RestTimerModal({ isOpen, restTime, onClose }: RestTimerModalProps) {
  const [timeLeft, setTimeLeft] = useState(restTime);

  // Effect to reset the timer whenever the modal opens with a new restTime
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(restTime);
    }
  }, [isOpen, restTime]);

  // Effect to handle the countdown interval
  useEffect(() => {
    // Exit if the modal isn't open or the timer has already run out
    if (!isOpen || timeLeft <= 0) {
      if (isOpen && timeLeft <= 0) {
        onClose(); // Close the modal when the timer hits zero
      }
      return;
    }

    // Set up an interval that decrements the time every second
    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    // Cleanup: clear the interval when the effect re-runs or the component unmounts
    return () => clearInterval(intervalId);
  }, [isOpen, timeLeft, onClose]);

  if (!isOpen) {
    return null;
  }

  // Use a React Portal to render the modal at the root of the document body,
  // which helps with stacking context and styling.
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" aria-modal="true">
      <div className="relative p-8 bg-white rounded-lg shadow-2xl w-full max-w-sm text-center">
        <h2 className="text-xl font-bold text-gray-500 uppercase">Rest Timer</h2>
        
        <p className="my-4 text-8xl font-mono font-extrabold text-indigo-600 tracking-tighter">
          {timeLeft}
        </p>

        <p className="text-gray-600">seconds remaining</p>

          <Button 
              onClick={onClose}
              className="w-full px-4 py-3 mt-6 font-semibold text-white bg-green-500 rounded-md shadow-sm hover:bg-green-600"
          >
            Skip Rest & Continue
          </Button>
      </div>
    </div>,
    document.body
  );
}