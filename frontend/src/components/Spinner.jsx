import React from 'react';

const Spinner = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className="w-12 h-12 rounded-full animate-spin border-4 border-solid border-cyan-500 border-t-transparent"
        role="status"
        aria-label="loading"
      ></div>
      <span className="text-gray-300">Loading...</span>
    </div>
  );
};

export default Spinner;
