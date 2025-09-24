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
import Admin from './pages/Admin/Admin';
import ProductMaintenance from './pages/Admin/ProductMaintenance';
import TemplateManagement from './pages/Admin/TemplateManagement';
import TemplateEditor from './pages/Admin/TemplateEditor';
import ElementManagement from './pages/Admin/ElementManagement';
import DatabaseReset from './pages/DatabaseReset';
import TestTemplateEditor from './pages/TestTemplateEditor';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
<Routes>
  {/* Admin 區域，不經過 Layout */}
  <Route path="/admin" element={<Admin />} />
  <Route path="/admin/products" element={<ProductMaintenance />} />
  <Route path="/admin/templates" element={<TemplateManagement />} />
  <Route path="/admin/templates/editor/:id" element={<TemplateEditor />} />
  <Route path="/admin/elements" element={<ElementManagement />} />
  <Route path="/admin/database-reset" element={<DatabaseReset />} />
  <Route path="/test-template-editor" element={<TestTemplateEditor />} />

  {/* Editor 也是獨立 */}
  <Route path="/editor/:id" element={<Editor />} />

  {/* 前台區域，經過 Layout */}
  <Route element={<Layout />}>
    <Route path="/" element={<Home />} />
    <Route path="/works" element={<MyWorks />} />
    <Route path="/products" element={<Products />} />
    <Route path="/products/:id" element={<ProductDetail />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/account" element={<Account />} />
  </Route>

  {/* 404 Not Found */}
  <Route path="*" element={<div>Page Not Found</div>} />
</Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
