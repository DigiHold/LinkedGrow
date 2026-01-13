"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

// Fake user data for social proof
const fakeUsers = [
  { name: "Nicolas", city: "Zurich" },
  { name: "Marie", city: "Geneva" },
  { name: "Thomas", city: "Berlin" },
  { name: "Sophie", city: "Paris" },
  { name: "Marco", city: "Milan" },
  { name: "Emma", city: "London" },
  { name: "Lucas", city: "Amsterdam" },
  { name: "Anna", city: "Vienna" },
  { name: "David", city: "Barcelona" },
  { name: "Julia", city: "Munich" },
  { name: "Michael", city: "New York" },
  { name: "Sarah", city: "San Francisco" },
  { name: "Alex", city: "Toronto" },
  { name: "Laura", city: "Sydney" },
  { name: "Peter", city: "Stockholm" },
  { name: "Elena", city: "Madrid" },
  { name: "James", city: "Dublin" },
  { name: "Lisa", city: "Copenhagen" },
  { name: "Oliver", city: "Brussels" },
  { name: "Camille", city: "Lyon" },
];

// Generate random time ago text
function getTimeAgo(): string {
  const options = [
    "just now",
    "1 min ago",
    "2 mins ago",
    "3 mins ago",
    "5 mins ago",
  ];
  return options[Math.floor(Math.random() * options.length)];
}

export function ActivityToast() {
  const [visible, setVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(fakeUsers[0]);
  const [timeAgo, setTimeAgo] = useState("just now");

  useEffect(() => {
    // Show first notification after 8 seconds
    const initialDelay = setTimeout(() => {
      showNotification();
    }, 8000);

    return () => clearTimeout(initialDelay);
  }, []);

  const showNotification = () => {
    // Pick a random user
    const randomUser = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
    setCurrentUser(randomUser);
    setTimeAgo(getTimeAgo());
    setVisible(true);

    // Hide after 4 seconds
    setTimeout(() => {
      setVisible(false);

      // Schedule next notification (15-30 seconds later)
      const nextDelay = 15000 + Math.random() * 15000;
      setTimeout(showNotification, nextDelay);
    }, 4000);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-4 left-4 z-[9999] max-w-xs"
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-start gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900 dark:text-white">
                <span className="font-semibold">{currentUser.name}</span>
                <span className="text-slate-600 dark:text-slate-400"> from </span>
                <span className="font-medium">{currentUser.city}</span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Users className="w-3.5 h-3.5" />
                joined the waitlist
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {timeAgo}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => setVisible(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Subtle pulse effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-sm -z-10" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
