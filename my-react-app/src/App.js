import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { CartProvider } from './context/CartContext';

// Pages
import Home from './pages/Home/Home';
import Products from './pages/Products/Products';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import MyWorks from './pages/MyWorks/MyWorks';
import Cart from './pages/Cart/Cart';
import Account from './pages/Account/Account';
import Editor from './pages/Editor/Editor';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/editor/:id" element={<Editor />} />
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/works" element={<MyWorks />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/account" element={<Account />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
