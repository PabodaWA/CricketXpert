import React from 'react';
import Header from './Header';
import Footer from './Footer';

// The main App component which renders the HomePage.
export default function App() {
  return <HomePage />;
}

function HomePage() {
  return (
    // Main background color updated to light gray
    <div className="bg-background min-h-screen font-sans">
      
      <Header />

      {/* Main Content Section */}
      <main>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Heading text color updated to black, accent color updated to sky blue */}
          <h1 className="text-4xl font-extrabold tracking-tight text-text-heading sm:text-5xl md:text-6xl">
            This is only for <span className="text-secondary">Testing Purposes</span>
          </h1>
          
          {/* Body text color updated to steel blue */}
          <p className="mt-3 max-w-md mx-auto text-lg text-text-body sm:text-xl md:mt-5 md:max-w-3xl">
            For test Front-End files related to crud operations, till we make our official home page.
          </p>
          
          {/* Action Buttons Section - Updated with new button colors */}
          <div className="mt-10 max-w-lg mx-auto sm:flex sm:justify-center md:mt-12 space-y-4 sm:space-y-0 sm:space-x-4">
            
            {/* Primary Button: Sky blue with darker hover state */}
            <button className="w-full sm:w-auto bg-secondary hover:bg-secondary-hover text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300">
              Test 1
            </button>
            
            {/* Secondary Button: Orange-brown */}
            <button className="w-full sm:w-auto bg-accent hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300">
              Test 2
            </button>
            
            {/* Secondary Button: Orange-brown */}
            <button className="w-full sm:w-auto bg-accent hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300">
              Test 3
            </button>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
