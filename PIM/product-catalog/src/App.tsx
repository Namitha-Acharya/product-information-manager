import { useState } from 'react';
import ProductCatalog from './components/ProductCatalog';
import CreateProduct from './components/CreateProduct';
import './App.css';

type CurrentView = 'catalog' | 'create';

function App() {
  const [currentView, setCurrentView] = useState<CurrentView>('catalog');

  const handleCreateProduct = () => {
    setCurrentView('create');
  };

  const handleBackToCatalog = () => {
    setCurrentView('catalog');
  };

  const handleSaveProduct = () => {
    // Product saved, go back to catalog
    setCurrentView('catalog');
  };

  return (
    <div className="App">
      {currentView === 'catalog' && (
        <ProductCatalog onCreateProduct={handleCreateProduct} />
      )}
      {currentView === 'create' && (
        <CreateProduct 
          onBack={handleBackToCatalog} 
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}

export default App;
