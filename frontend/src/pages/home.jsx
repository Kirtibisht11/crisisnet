import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-10 text-center">
        <h1 className="text-4xl font-bold mb-4">CrisisNet</h1>
        <p className="text-gray-600 mb-6">Real-time community crisis alerts — citizens, volunteers, and authorities.</p>

        <div className="grid gap-3 md:grid-cols-3 mb-6">
          <Link to="/login" className="px-4 py-3 bg-blue-600 text-white rounded-lg">Login</Link>
          <Link to="/signup" className="px-4 py-3 bg-green-600 text-white rounded-lg">Sign Up</Link>
        </div>

      </div>
    </div>
  );
}
