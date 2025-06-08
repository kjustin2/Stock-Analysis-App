import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import GameContainer from './components/Game/GameContainer';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-100">
          <header className="bg-blue-600 text-white py-4">
            <div className="container mx-auto px-4">
              <h1 className="text-3xl font-bold">Pharmacy Business Simulator</h1>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            <GameContainer />
          </main>
        </div>
      </ErrorBoundary>
    </Provider>
  );
};

export default App;
