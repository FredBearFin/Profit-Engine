import React, { useState, useEffect, useRef } from 'react';

import { initializeApp } from "firebase/app";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    limit
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB4z-JrEmvqtzshnsvEO_wTWWQ-eId5MOo",
  authDomain: "dropship-profit-calculator.firebaseapp.com",
  projectId: "dropship-profit-calculator",
  storageBucket: "dropship-profit-calculator.firebasestorage.app",
  messagingSenderId: "12386923384",
  appId: "1:12386923384:web:38891fd0cd2cb12badce8d",
  measurementId: "G-5X8WP42KQ8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Platform fee presets ---
const PLATFORMS = [
  { key: 'custom',   name: 'Custom',         feePct: 0,     feeFlat: 0,    note: null },
  { key: 'ebay',     name: 'eBay',           feePct: 13.25, feeFlat: 0,    note: '13.25%' },
  { key: 'mercari',  name: 'Mercari',        feePct: 10,    feeFlat: 0,    note: '10%' },
  { key: 'poshmark', name: 'Poshmark',       feePct: 20,    feeFlat: 0,    note: '20% on sales $15+' },
  { key: 'facebook', name: 'FB Marketplace', feePct: 5,     feeFlat: 0,    note: '5%' },
  { key: 'etsy',     name: 'Etsy',           feePct: 6.5,   feeFlat: 0.20, note: '6.5% + $0.20 listing' },
  { key: 'amazon',   name: 'Amazon FBA',     feePct: 15,    feeFlat: 4.00, note: '~15% + $4 fulfillment' },
  { key: 'whatnot',  name: 'Whatnot',        feePct: 8,     feeFlat: 0,    note: '8%' },
  { key: 'depop',    name: 'Depop',          feePct: 10,    feeFlat: 0,    note: '10%' },
];

// --- SVG Icons ---
const PlusCircle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
);
const LogIn = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
);
const LogOut = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);
const Trash2 = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);
const X = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const Save = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
);
const ChevronRight = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 18 15 12 9 6" /></svg>
);

const Spinner = ({ className = '' }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// --- Utilities ---
const fmtUSD = (n) => (isFinite(n) ? n : 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const roundNickel = (n) => Number((Math.round(n / 0.05) * 0.05).toFixed(2));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// Central profit calculation — used by all components so hidden costs are never missed
const computeProfit = (product, price, feePct, feeFlat) => {
  const { landed = 0, ship = 0, pack = 0, returnRate = 0, timeCostHr = 0, timeCostMin = 0 } = product;
  const timeCost = (timeCostHr * timeCostMin) / 60;
  const totalDirectCost = landed + ship + pack + timeCost;
  const fees = price * (feePct / 100) + feeFlat;
  const returnLoss = (returnRate / 100) * price;
  return price - totalDirectCost - fees - returnLoss;
};

// Suggested price at a target margin, accounting for all cost fields
const suggestPrice = (product, feePct, feeFlat, targetMargin = 0.33) => {
  const { landed = 0, ship = 0, pack = 0, returnRate = 0, timeCostHr = 0, timeCostMin = 0 } = product;
  const timeCost = (timeCostHr * timeCostMin) / 60;
  const totalCost = landed + ship + pack + timeCost;
  const f = feePct / 100;
  const r = (returnRate || 0) / 100;
  const denom = 1 - f - r - targetMargin;
  if (denom <= 0) return null;
  return roundNickel((totalCost + feeFlat) / denom);
};

const createBlankProduct = () => ({
    name: 'Untitled Product',
    platform: 'custom',
    landed: 5.00,
    ship: 3.50,
    pack: 0.50,
    feePct: 15,
    feeFlat: 0.00,
    returnRate: 0,
    timeCostHr: 0,
    timeCostMin: 0,
    price: 19.99,
    minPrice: 10,
    maxPrice: 50,
    competitorPrice: 0,
    createdAt: serverTimestamp()
});

// --- Main App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState(null);
  const [mode, setMode] = useState('calculator');
  const [dealHistory, setDealHistory] = useState([]);
  const [qfCost, setQfCost] = useState('');
  const [qfPrice, setQfPrice] = useState('');
  const [qfPlatform, setQfPlatform] = useState('ebay');
  const productNameInputRef = useRef(null);

  const selectedProductData = products.find(p => p.id === selectedProductId);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      setLoadError(null);
      setUser(currentUser);
      try {
        if (currentUser) {
          const productsCollection = collection(db, 'users', currentUser.uid, 'products');
          const q = query(productsCollection, orderBy("createdAt", "desc"));
          const productSnapshot = await getDocs(q);
          const userProducts = productSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          if (userProducts.length > 0) {
            setProducts(userProducts);
            setSelectedProductId(userProducts[0].id);
          } else {
            const newProductData = createBlankProduct();
            const docRef = await addDoc(productsCollection, newProductData);
            setProducts([{ id: docRef.id, ...newProductData }]);
            setSelectedProductId(docRef.id);
          }
          // Load deal history (most recent 200)
          const histCol = collection(db, 'users', currentUser.uid, 'dealHistory');
          const histQ = query(histCol, orderBy('loggedAt', 'desc'), limit(200));
          const histSnap = await getDocs(histQ);
          setDealHistory(histSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          setDealHistory([]);
          const anonymousProduct = { id: 'anonymous', ...createBlankProduct() };
          setProducts([anonymousProduct]);
          setSelectedProductId('anonymous');
        }
      } catch (err) {
        setLoadError('Could not connect to the database. Check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogDeal = async (product, { silent = false } = {}) => {
    if (!user) return;
    const { price, feePct, feeFlat, name, platform } = product;
    const profit = computeProfit(product, price, feePct, feeFlat);
    const margin = price > 0 ? (profit / price) * 100 : 0;
    const platformData = PLATFORMS.find(p => p.key === (platform || 'custom'));
    const entry = {
      itemName: name || 'Untitled',
      platform: platform || 'custom',
      platformName: platformData?.name || 'Custom',
      salePrice: parseFloat(price.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      margin: parseFloat(margin.toFixed(2)),
      feePct,
      feeFlat,
      status: 'listed',
      loggedAt: serverTimestamp(),
    };
    try {
      const histCol = collection(db, 'users', user.uid, 'dealHistory');
      const docRef = await addDoc(histCol, entry);
      // Optimistic local update — use current time since serverTimestamp() resolves async
      setDealHistory(prev => [{ id: docRef.id, ...entry, loggedAt: { toDate: () => new Date() } }, ...prev]);
      if (!silent) showToast('Deal logged!');
    } catch (err) {
      if (!silent) showToast('Failed to log deal.', 'error');
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'dealHistory', dealId));
      setDealHistory(prev => prev.filter(d => d.id !== dealId));
    } catch (err) {
      showToast('Failed to delete entry.', 'error');
    }
  };

  const handleUpdateDealStatus = async (dealId, newStatus) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'dealHistory', dealId), { status: newStatus });
      setDealHistory(prev => prev.map(d => d.id === dealId ? { ...d, status: newStatus } : d));
    } catch (err) {
      showToast('Failed to update status.', 'error');
    }
  };

  const handleSaveProduct = async () => {
    if (!user) { setAuthModalOpen(true); return; }
    if (!selectedProductData || selectedProductData.id === 'anonymous') return;
    setIsSaving(true);
    try {
      const { id, ...dataToSave } = selectedProductData;
      const productDoc = doc(db, 'users', user.uid, 'products', id);
      await updateDoc(productDoc, dataToSave);
      showToast('Saved!');
    } catch (err) {
      showToast('Failed to save. Try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewProduct = async () => {
    if (!user || isAdding) return;
    setIsAdding(true);
    try {
      const productsCollection = collection(db, 'users', user.uid, 'products');
      const newProductData = createBlankProduct();
      const docRef = await addDoc(productsCollection, newProductData);
      const newProduct = { id: docRef.id, ...newProductData };
      setProducts([newProduct, ...products]);
      setSelectedProductId(docRef.id);
      setTimeout(() => {
        productNameInputRef.current?.focus();
        productNameInputRef.current?.select();
      }, 0);
    } catch (err) {
      showToast('Failed to add product. Try again.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!user || products.length <= 1) return;
    try {
      const productDoc = doc(db, 'users', user.uid, 'products', productId);
      await deleteDoc(productDoc);
      const newProducts = products.filter(p => p.id !== productId);
      setProducts(newProducts);
      setSelectedProductId(newProducts[0]?.id || null);
    } catch (err) {
      showToast('Failed to delete. Try again.', 'error');
    }
  };

  const handleProductChange = (field, value) => {
    if (!selectedProductData) return;
    const updatedFields = { [field]: value };
    const costFields = ['landed', 'ship', 'pack', 'feePct', 'feeFlat', 'returnRate', 'timeCostHr', 'timeCostMin'];
    if (costFields.includes(field)) {
      const current = { ...selectedProductData, ...updatedFields };
      const suggested = suggestPrice(current, current.feePct, current.feeFlat);
      if (suggested !== null) {
        updatedFields.price = suggested;
        updatedFields.minPrice = Math.round(suggested * 0.5);
        updatedFields.maxPrice = Math.round(suggested * 2);
      }
    }
    const updated = { ...selectedProductData, ...updatedFields };
    setProducts(products.map(p => p.id === selectedProductId ? updated : p));
  };

  const handlePlatformSelect = (platformKey) => {
    const platform = PLATFORMS.find(p => p.key === platformKey);
    if (!platform || !selectedProductData) return;
    const updatedFields = { platform: platformKey, feePct: platform.feePct, feeFlat: platform.feeFlat };
    const productWithNewFees = { ...selectedProductData, ...updatedFields };
    const suggested = suggestPrice(productWithNewFees, platform.feePct, platform.feeFlat);
    if (suggested !== null) {
      updatedFields.price = suggested;
      updatedFields.minPrice = Math.round(suggested * 0.5);
      updatedFields.maxPrice = Math.round(suggested * 2);
    }
    const updated = { ...selectedProductData, ...updatedFields };
    setProducts(products.map(p => p.id === selectedProductId ? updated : p));
  };

  const handlePriceChange = (newPrice) => {
    if (!selectedProductData) return;
    const clamped = roundNickel(clamp(newPrice, selectedProductData.minPrice, selectedProductData.maxPrice));
    handleProductChange('price', clamped);
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Spinner className="w-10 h-10 text-emerald-600" />
        <p className="text-slate-500 text-sm font-medium">Loading Profit Engine...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-6 text-center">
        <p className="text-red-500 font-semibold">{loadError}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-emerald-600 font-semibold underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <Header user={user} onLoginClick={() => setAuthModalOpen(true)} />

      <main className="p-4 md:p-6 lg:p-8">
        <div className="flex gap-1.5 mb-6 bg-white p-1.5 rounded-xl shadow-sm max-w-lg">
          <button
            onClick={() => setMode('calculator')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'calculator' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Full Calculator
          </button>
          <button
            onClick={() => setMode('quickflip')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'quickflip' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
          >
            ⚡ Quick Flip
          </button>
          <button
            onClick={() => setMode('history')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'history' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
          >
            📋 History
            {dealHistory.length > 0 && (
              <span className="ml-1.5 text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">{dealHistory.length >= 200 ? '200+' : dealHistory.length}</span>
            )}
          </button>
        </div>

        {mode === 'history' ? (
          <DealHistory
            dealHistory={dealHistory}
            onDeleteDeal={handleDeleteDeal}
            onUpdateStatus={handleUpdateDealStatus}
            user={user}
            onLoginClick={() => setAuthModalOpen(true)}
          />
        ) : mode === 'quickflip' ? (
          <QuickFlip
            user={user}
            onLogDeal={handleLogDeal}
            onLoginClick={() => setAuthModalOpen(true)}
            cost={qfCost} setCost={setQfCost}
            price={qfPrice} setPrice={setQfPrice}
            platformKey={qfPlatform} setPlatformKey={setQfPlatform}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {user && (
              <ProductSidebar
                products={products}
                selectedProductId={selectedProductId}
                onSelectProduct={setSelectedProductId}
                onAddProduct={handleAddNewProduct}
                onDeleteProduct={handleDeleteProduct}
                isAdding={isAdding}
              />
            )}
            <div className={user ? "lg:col-span-3" : "lg:col-span-4"}>
              {selectedProductData ? (
                <div className="space-y-6">
                  <Calculator
                    product={selectedProductData}
                    onProductChange={handleProductChange}
                    onPlatformSelect={handlePlatformSelect}
                    onPriceChange={handlePriceChange}
                    onSave={handleSaveProduct}
                    isSaving={isSaving}
                    user={user}
                    productNameInputRef={productNameInputRef}
                  />
                  <ProfitBreakdown product={selectedProductData} />
                  <PlatformComparison product={selectedProductData} />
                  <StrategyPanel
                    product={selectedProductData}
                    onPriceChange={handlePriceChange}
                    onProductChange={handleProductChange}
                    onLogDeal={() => handleLogDeal(selectedProductData)}
                    onLoginClick={() => setAuthModalOpen(true)}
                    user={user}
                  />
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <p>Select a product or add a new one.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {isAuthModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-50 text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// --- Header ---
function Header({ user, onLoginClick }) {
  return (
    <header className="bg-slate-900 shadow-lg p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill="#059669"/>
          <polyline points="4,32 13,20 21,25 34,8" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="27,6 34,6 34,13" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Profit Engine</h1>
          <p className="text-xs text-emerald-400 hidden md:block">the profit calculator built for resellers.</p>
        </div>
      </div>
      <div>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden md:block">{user.email}</span>
            <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="hidden md:block">Logout</span>
            </button>
          </div>
        ) : (
          <button onClick={onLoginClick} className="flex items-center gap-2 text-sm font-semibold bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors shadow">
            <LogIn className="w-5 h-5" />
            Login / Sign Up
          </button>
        )}
      </div>
    </header>
  );
}

// --- Product Sidebar ---
function ProductSidebar({ products, selectedProductId, onSelectProduct, onAddProduct, onDeleteProduct, isAdding }) {
  return (
    <aside className="lg:col-span-1 bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-lg font-bold text-slate-800 mb-4">My Products</h2>
      <div className="space-y-2">
        {products.map(product => (
          <div
            key={product.id}
            onClick={() => onSelectProduct(product.id)}
            className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedProductId === product.id ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100'}`}
          >
            <span className="font-semibold truncate pr-2">{product.name || 'Untitled Product'}</span>
            {products.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteProduct(product.id); }}
                className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={onAddProduct}
        disabled={isAdding}
        className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors py-2 rounded-lg hover:bg-emerald-50 disabled:opacity-50"
      >
        {isAdding ? <Spinner className="w-4 h-4" /> : <PlusCircle className="w-5 h-5" />}
        {isAdding ? 'Adding...' : 'Add New Product'}
      </button>
    </aside>
  );
}

// --- Calculator ---
function Calculator({ product, onProductChange, onPlatformSelect, onPriceChange, onSave, isSaving, user, productNameInputRef }) {
    const [salePriceInput, setSalePriceInput] = useState(product.price);
    const [showHiddenCosts, setShowHiddenCosts] = useState(false);

    useEffect(() => { setSalePriceInput(product.price); }, [product.price]);

    const handleSalePriceInputCommit = () => {
        let val = parseFloat(salePriceInput);
        if (isNaN(val)) val = product.minPrice;
        const clamped = roundNickel(clamp(val, product.minPrice, product.maxPrice));
        setSalePriceInput(clamped);
        onPriceChange(clamped);
    };

    const hasHiddenCosts = (product.returnRate > 0) || (product.timeCostHr > 0 && product.timeCostMin > 0);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            {/* Platform selector */}
            <div className="mb-5">
                <label className="block text-sm font-medium text-slate-600 mb-2">Platform</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {PLATFORMS.filter(p => p.key !== 'custom').map(p => (
                        <button
                            key={p.key}
                            onClick={() => onPlatformSelect(p.key)}
                            className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all leading-tight ${(product.platform || 'custom') === p.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                    <button
                        onClick={() => onPlatformSelect('custom')}
                        className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${(product.platform || 'custom') === 'custom' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'}`}
                    >
                        Custom
                    </button>
                </div>
                {(() => {
                    const sel = PLATFORMS.find(p => p.key === (product.platform || 'custom'));
                    return sel?.note ? <p className="text-xs text-slate-400 mt-1.5">{sel.note}</p> : null;
                })()}
            </div>

            {/* Core cost inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Input id="name" label="Product Name" value={product.name} onChange={e => onProductChange('name', e.target.value)} ref={productNameInputRef} />
                <Input id="landed" label="Item Cost" type="number" value={product.landed} onChange={e => onProductChange('landed', parseFloat(e.target.value) || 0)} icon="$" />
                <Input id="ship" label="Outbound Shipping" type="number" value={product.ship} onChange={e => onProductChange('ship', parseFloat(e.target.value) || 0)} icon="$" />
                <Input id="pack" label="Shipping Supplies" type="number" value={product.pack} onChange={e => onProductChange('pack', parseFloat(e.target.value) || 0)} icon="$" />
                <Input id="feePct" label="Marketplace Fee %" type="number" value={product.feePct} onChange={e => onProductChange('feePct', parseFloat(e.target.value) || 0)} icon="%" />
                <Input id="feeFlat" label="Flat Fee" type="number" value={product.feeFlat} onChange={e => onProductChange('feeFlat', parseFloat(e.target.value) || 0)} icon="$" />
            </div>

            {/* Hidden costs — collapsible */}
            <div className="mt-5 border-t border-slate-100 pt-4">
                <button
                    onClick={() => setShowHiddenCosts(v => !v)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors w-full text-left"
                >
                    <ChevronRight className={`transition-transform duration-200 ${showHiddenCosts ? 'rotate-90' : ''}`} />
                    Hidden Costs
                    <span className="text-xs font-normal text-slate-400">— returns, your time</span>
                    {hasHiddenCosts && (
                        <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">active</span>
                    )}
                </button>

                {showHiddenCosts && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <Input
                                id="returnRate"
                                label="Return Rate"
                                type="number"
                                value={product.returnRate || 0}
                                onChange={e => onProductChange('returnRate', parseFloat(e.target.value) || 0)}
                                icon="%"
                            />
                            <p className="text-xs text-slate-400 mt-1">% of sales that get returned</p>
                        </div>
                        <div>
                            <Input
                                id="timeCostHr"
                                label="Your hourly rate"
                                type="number"
                                value={product.timeCostHr || 0}
                                onChange={e => onProductChange('timeCostHr', parseFloat(e.target.value) || 0)}
                                icon="$"
                            />
                            <p className="text-xs text-slate-400 mt-1">What your time is worth/hr</p>
                        </div>
                        <div>
                            <Input
                                id="timeCostMin"
                                label="Minutes per item"
                                type="number"
                                value={product.timeCostMin || 0}
                                onChange={e => onProductChange('timeCostMin', parseFloat(e.target.value) || 0)}
                            />
                            {product.timeCostHr > 0 && product.timeCostMin > 0 && (
                                <p className="text-xs text-emerald-600 mt-1 font-semibold">
                                    = {fmtUSD((product.timeCostHr * product.timeCostMin) / 60)} per item
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <hr className="my-6 border-slate-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                    <div className="text-center">
                        <label htmlFor="salePriceInput" className="text-sm font-medium text-slate-600">Sale Price</label>
                        <div className="mt-1 flex items-center justify-center gap-1">
                            <span className="text-2xl font-bold text-slate-400">$</span>
                            <input
                                type="number"
                                id="salePriceInput"
                                value={salePriceInput}
                                onChange={e => setSalePriceInput(e.target.value)}
                                onBlur={handleSalePriceInputCommit}
                                onKeyDown={e => e.key === 'Enter' && handleSalePriceInputCommit()}
                                className="w-36 text-center text-4xl font-bold text-emerald-700 bg-transparent border-none focus:ring-0 min-w-0"
                                step="0.05"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        <button onClick={() => onPriceChange(product.price - 0.05)} className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition text-lg font-bold flex-shrink-0">−</button>
                        <input type="range" min={product.minPrice} max={product.maxPrice} step="0.05" value={product.price} onChange={e => onPriceChange(parseFloat(e.target.value))} className="w-full" />
                        <button onClick={() => onPriceChange(product.price + 0.05)} className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition text-lg font-bold flex-shrink-0">+</button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input id="minPrice" label="Min Price" type="number" value={product.minPrice} onChange={e => onProductChange('minPrice', parseInt(e.target.value, 10) || 0)} icon="$" step="1" />
                    <Input id="maxPrice" label="Max Price" type="number" value={product.maxPrice} onChange={e => onProductChange('maxPrice', parseInt(e.target.value, 10) || 0)} icon="$" step="1" />
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto sm:float-right flex items-center justify-center gap-2 font-semibold bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow disabled:opacity-60"
                >
                    {isSaving ? <Spinner className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {isSaving ? 'Saving...' : (user ? 'Save Changes' : 'Save & Sign Up')}
                </button>
            </div>
        </div>
    );
}

// --- Profit Breakdown Visualization ---
// Pure CSS stacked bar — no chart library needed
function ProfitBreakdown({ product }) {
    const { landed = 0, ship = 0, pack = 0, feePct, feeFlat, price, returnRate = 0, timeCostHr = 0, timeCostMin = 0 } = product;
    const timeCost = (timeCostHr * timeCostMin) / 60;
    const returnLoss = (returnRate / 100) * price;
    const platformFees = price * (feePct / 100) + feeFlat;
    const profit = computeProfit(product, price, feePct, feeFlat);

    if (price <= 0) return null;

    const hasHiddenCosts = timeCost > 0 || returnLoss > 0;

    const segments = [
        { label: 'Item cost',        value: landed,               color: 'bg-slate-500',   dot: 'bg-slate-500' },
        { label: 'Ship + supplies',  value: ship + pack,          color: 'bg-sky-400',     dot: 'bg-sky-400' },
        { label: 'Platform fee',     value: platformFees,         color: 'bg-amber-400',   dot: 'bg-amber-400' },
    ];

    if (hasHiddenCosts) {
        segments.push({ label: 'Returns & time', value: returnLoss + timeCost, color: 'bg-orange-400', dot: 'bg-orange-400' });
    }

    if (profit >= 0) {
        segments.push({ label: 'Your profit', value: profit, color: 'bg-emerald-500', dot: 'bg-emerald-500' });
    } else {
        // Loss: extend the bar visually beyond 100% with a red overflow indicator
        segments.push({ label: 'Loss', value: Math.abs(profit), color: 'bg-red-500', dot: 'bg-red-500' });
    }

    // Clamp widths to 0–100% of price for display purposes
    const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0);
    const displayTotal = Math.max(total, price);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Profit Breakdown</h3>
            <p className="text-sm text-slate-500 mb-4">Where your {fmtUSD(price)} goes.</p>

            {/* Stacked bar */}
            <div className="flex h-10 rounded-xl overflow-hidden mb-5 gap-px">
                {segments.map((seg, i) => (
                    <div
                        key={i}
                        title={`${seg.label}: ${fmtUSD(seg.value)}`}
                        className={`${seg.color} transition-all duration-500 first:rounded-l-xl last:rounded-r-xl`}
                        style={{ width: `${Math.max(0, (seg.value / displayTotal) * 100)}%`, minWidth: seg.value > 0 ? '2px' : '0' }}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-sm flex-shrink-0 mt-0.5 ${seg.dot}`} />
                        <div className="min-w-0">
                            <p className="text-xs text-slate-500 leading-tight">{seg.label}</p>
                            <p className={`text-sm font-bold ${seg.label === 'Your profit' ? 'text-emerald-600' : seg.label === 'Loss' ? 'text-red-500' : 'text-slate-800'}`}>
                                {fmtUSD(seg.value)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Platform Comparison Table ---
// Shows profit and margin for the current item across all platforms, sorted best first
function PlatformComparison({ product }) {
    const { price } = product;

    const results = PLATFORMS
        .filter(p => p.key !== 'custom')
        .map(p => {
            const profit = computeProfit(product, price, p.feePct, p.feeFlat);
            const margin = price > 0 ? (profit / price) * 100 : 0;
            const fees = price * (p.feePct / 100) + p.feeFlat;
            return { ...p, profit, margin, fees };
        })
        .sort((a, b) => b.margin - a.margin);

    const maxMargin = Math.max(...results.map(r => r.margin), 0);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Platform Comparison</h3>
            <p className="text-sm text-slate-500 mb-4">Same item at {fmtUSD(price)} — where should you list?</p>

            <div className="space-y-2">
                {results.map((r, i) => (
                    <div
                        key={r.key}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${i === 0 ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-slate-50'}`}
                    >
                        {/* Platform name + fee note */}
                        <div className="w-32 flex-shrink-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {i === 0 && (
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">BEST</span>
                                )}
                                <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                            </div>
                            <p className="text-xs text-slate-400">{r.note}</p>
                        </div>

                        {/* Relative margin bar */}
                        <div className="flex-1 min-w-0">
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${r.margin <= 0 ? 'bg-red-400' : i === 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                    style={{ width: `${maxMargin > 0 ? Math.max(0, (r.margin / maxMargin) * 100) : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Profit + margin */}
                        <div className="text-right flex-shrink-0 w-20">
                            <p className={`text-sm font-bold ${r.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {fmtUSD(r.profit)}
                            </p>
                            <p className={`text-xs ${r.margin > 0 ? 'text-slate-500' : 'text-red-400'}`}>
                                {r.margin.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Quick Flip Mode ---
function QuickFlip({ user, onLogDeal, onLoginClick, cost, setCost, price, setPrice, platformKey, setPlatformKey }) {

    const platform = PLATFORMS.find(p => p.key === platformKey);
    const costNum = parseFloat(cost) || 0;
    const priceNum = parseFloat(price) || 0;
    const hasValues = costNum > 0 && priceNum > 0;

    // Use computeProfit for consistency — pass a minimal product-like object
    const fakeProduct = { landed: costNum, ship: 0, pack: 0, returnRate: 0, timeCostHr: 0, timeCostMin: 0 };
    const profit = computeProfit(fakeProduct, priceNum, platform.feePct, platform.feeFlat);
    const fees = priceNum * (platform.feePct / 100) + platform.feeFlat;
    const margin = priceNum > 0 ? (profit / priceNum) * 100 : 0;

    let verdict = null;
    if (hasValues) {
        if (margin >= 20)      verdict = { icon: '✅', tone: 'emerald', label: 'Flip it.',           sub: 'Solid margin — go for it.' };
        else if (margin >= 10) verdict = { icon: '⚠️', tone: 'amber',   label: 'Slim margin.',       sub: 'Know your costs before committing.' };
        else                   verdict = { icon: '❌', tone: 'red',     label: profit < 0 ? "You'd lose money." : 'Not worth it.', sub: 'Pass on this one.' };
    }

    const toneClasses = {
        emerald: { card: 'bg-emerald-50 border-emerald-300', label: 'text-emerald-700', profit: 'text-emerald-600' },
        amber:   { card: 'bg-amber-50 border-amber-300',     label: 'text-amber-700',   profit: 'text-amber-600' },
        red:     { card: 'bg-red-50 border-red-300',         label: 'text-red-700',     profit: 'text-red-500' },
    };
    const tc = verdict ? toneClasses[verdict.tone] : null;

    return (
        <div className="max-w-sm mx-auto space-y-4 pt-1 pb-8">
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Platform</p>
                <div className="grid grid-cols-3 gap-2">
                    {PLATFORMS.filter(p => p.key !== 'custom').map(p => (
                        <button
                            key={p.key}
                            onClick={() => setPlatformKey(p.key)}
                            className={`py-2.5 px-1 rounded-lg text-xs font-semibold border transition-all leading-tight ${platformKey === p.key ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
                {platform?.note && <p className="text-xs text-slate-400 mt-2.5 text-center">{platform.note}</p>}
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 space-y-5">
                <BigInput label="What did you pay?" value={cost} onChange={setCost} />
                <BigInput label="What's it selling for?" value={price} onChange={setPrice} />
            </div>

            {hasValues ? (
                <div className={`rounded-xl border-2 p-5 ${tc.card}`}>
                    <div className="flex items-start gap-3 mb-4">
                        <span className="text-4xl leading-none mt-0.5">{verdict.icon}</span>
                        <div>
                            <p className={`text-2xl font-bold leading-tight ${tc.label}`}>{verdict.label}</p>
                            <p className={`text-sm mt-0.5 ${tc.label} opacity-75`}>{verdict.sub}</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm border-t border-slate-200 pt-3">
                        <div className="flex justify-between text-slate-600">
                            <span>Sale price</span>
                            <span className="font-semibold text-slate-800">{fmtUSD(priceNum)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>{platform.name} fee ({platform.feePct}%{platform.feeFlat > 0 ? ` + ${fmtUSD(platform.feeFlat)}` : ''})</span>
                            <span className="font-semibold text-red-500">−{fmtUSD(fees)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Your cost</span>
                            <span className="font-semibold text-red-500">−{fmtUSD(costNum)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 mt-1">
                            <span className="font-bold text-slate-800">Net profit</span>
                            <span className={`font-bold text-xl ${tc.profit}`}>{fmtUSD(profit)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Margin</span>
                            <span className={`font-semibold ${tc.profit}`}>{margin.toFixed(1)}%</span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (!user) { onLoginClick(); return; }
                            const qfProduct = {
                                name: 'Quick Flip',
                                platform: platformKey,
                                price: priceNum,
                                landed: costNum,
                                ship: 0, pack: 0, returnRate: 0, timeCostHr: 0, timeCostMin: 0,
                                feePct: platform.feePct,
                                feeFlat: platform.feeFlat,
                            };
                            onLogDeal(qfProduct);
                        }}
                        className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-lg transition-colors"
                    >
                        📋 {user ? 'Log This Deal' : 'Log In to Save Deals'}
                    </button>
                </div>
            ) : (
                <p className="text-center text-slate-400 text-sm py-6">Enter your cost and the sale price above.</p>
            )}
        </div>
    );
}

function BigInput({ label, value, onChange }) {
    return (
        <div>
            <p className="text-sm font-semibold text-slate-600 mb-2">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-300">$</span>
                <input
                    type="number"
                    inputMode="decimal"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 text-4xl font-bold text-slate-800 bg-transparent border-b-2 border-slate-200 focus:border-emerald-500 focus:outline-none pb-1 min-w-0 placeholder-slate-200"
                />
            </div>
        </div>
    );
}

// --- Strategy Panel ---
function StrategyPanel({ product, onPriceChange, onProductChange, onLogDeal, onLoginClick, user }) {
    const { feePct, feeFlat, price, competitorPrice } = product;

    const calcProfit = (p) => computeProfit(product, p, feePct, feeFlat);
    const profit = calcProfit(price);

    const priceForMargin = (targetMargin) => {
        const p = suggestPrice(product, feePct, feeFlat, targetMargin);
        return p ?? NaN;
    };

    const margins = [0.10, 0.15, 0.20, 0.25, 0.33, 0.40, 0.50, 0.75];

    // Breakeven: price where profit = 0
    const { landed = 0, ship = 0, pack = 0, returnRate = 0, timeCostHr = 0, timeCostMin = 0 } = product;
    const timeCost = (timeCostHr * timeCostMin) / 60;
    const totalDirectCost = landed + ship + pack + timeCost;
    const breakevenDenom = 1 - feePct / 100 - (returnRate || 0) / 100;
    const breakeven = breakevenDenom > 0 ? (totalDirectCost + feeFlat) / breakevenDenom : Infinity;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Quick Targets</h3>
                        <p className="text-sm text-slate-500 mb-4">Instantly set price for a target margin.</p>
                        <div className="grid grid-cols-4 gap-2">
                            {margins.map(margin => (
                                <button
                                    key={margin}
                                    onClick={() => { const p = priceForMargin(margin); if (!isNaN(p)) onPriceChange(p); }}
                                    className="text-sm font-semibold py-3 bg-slate-100 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
                                >
                                    {Math.round(margin * 100)}%
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Strategic Analysis</h3>
                        <p className="text-sm text-slate-500 mb-4">Analyze and act on competitor pricing.</p>
                        <Input id="competitorPrice" label="Competitor's Price" type="number" value={competitorPrice || ''} onChange={e => onProductChange('competitorPrice', parseFloat(e.target.value) || 0)} icon="$" />
                        {competitorPrice > 0 && (
                            <div className="mt-4 space-y-3">
                                <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                                    You are currently <span className={`font-bold ${price < competitorPrice ? 'text-green-600' : 'text-red-600'}`}>{fmtUSD(Math.abs(price - competitorPrice))} {price < competitorPrice ? 'below' : 'above'}</span> them.
                                </div>
                                <div className="space-y-2">
                                    <StrategyButton label="Price to Beat"     newPrice={competitorPrice - 0.50}  profit={calcProfit(competitorPrice - 0.50)}  onClick={onPriceChange} />
                                    <StrategyButton label="Price to Match"    newPrice={competitorPrice}          profit={calcProfit(competitorPrice)}          onClick={onPriceChange} />
                                    <StrategyButton label="Price for Premium" newPrice={competitorPrice * 1.05}  profit={calcProfit(competitorPrice * 1.05)}  onClick={onPriceChange} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <StatCard label="Net Profit"      value={fmtUSD(profit)}                                                                    isPositive={profit >= 0} />
            <StatCard label="Net Margin"      value={`${(price > 0 ? (profit / price) * 100 : 0).toFixed(1)}%`}                        isPositive={profit >= 0} />
            <StatCard label="Breakeven Price" value={fmtUSD(breakeven)} />
            <div className="md:col-span-3 flex justify-end">
              <button
                onClick={user ? onLogDeal : onLoginClick}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                📋 {user ? 'Log This Deal' : 'Log In to Save Deals'}
              </button>
            </div>
        </div>
    );
}

function StrategyButton({ label, newPrice, profit, onClick }) {
    const roundedPrice = roundNickel(newPrice);
    return (
        <button onClick={() => onClick(roundedPrice)} className="w-full text-left p-3 bg-slate-100 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 transition-colors">
            <div className="font-semibold">{label}</div>
            <div className="text-xs text-slate-600">
                Set Price: <span className="font-bold">{fmtUSD(roundedPrice)}</span> | Profit: <span className="font-bold">{fmtUSD(profit)}</span>
            </div>
        </button>
    );
}

const Input = React.forwardRef(({ id, label, type = "text", value, onChange, icon, step }, ref) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
    <div className="relative">
      {icon && <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">{icon}</span>}
      <input
        ref={ref} type={type} id={id} value={value} onChange={onChange}
        step={step || (type === 'number' ? '0.01' : undefined)}
        className={`w-full py-3 px-3 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 transition ${icon ? 'pl-8' : 'pl-3'}`}
      />
    </div>
  </div>
));

function StatCard({ label, value, isPositive }) {
    const valueColor = isPositive === true ? 'text-green-600' : isPositive === false ? 'text-red-500' : 'text-slate-800';
    return (
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <h3 className="text-sm font-medium text-slate-500">{label}</h3>
            <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
        </div>
    );
}

// --- Deal History ---
const STATUS_META = {
    listed: { label: 'Listed',  pill: 'bg-sky-100 text-sky-700',          active: 'bg-sky-600 text-white border-sky-600' },
    sold:   { label: 'Sold',    pill: 'bg-emerald-100 text-emerald-700',   active: 'bg-emerald-600 text-white border-emerald-600' },
    passed: { label: 'Passed',  pill: 'bg-slate-100 text-slate-500',       active: 'bg-slate-500 text-white border-slate-500' },
};

function DealHistory({ dealHistory, onDeleteDeal, onUpdateStatus, user, onLoginClick }) {
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [activeStatusId, setActiveStatusId] = useState(null);

    if (!user) {
        return (
            <div className="max-w-lg mx-auto bg-white rounded-xl shadow-md p-10 text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-lg font-bold text-slate-800 mb-1">Your deal log lives here</p>
                <p className="text-slate-500 text-sm mb-6">Log deals and tag them as Listed, Sold, or Passed. Track your win rate over time.</p>
                <button
                    onClick={onLoginClick}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow"
                >
                    Log In / Sign Up
                </button>
            </div>
        );
    }

    if (dealHistory.length === 0) {
        return (
            <div className="max-w-lg mx-auto bg-white rounded-xl shadow-md p-10 text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-lg font-bold text-slate-800 mb-1">No deals logged yet</p>
                <p className="text-slate-500 text-sm">Use the "Log This Deal" button on any calculation to start your deal log.</p>
            </div>
        );
    }

    const soldDeals   = dealHistory.filter(d => d.status === 'sold');
    const passedDeals = dealHistory.filter(d => d.status === 'passed');
    const decidedCount = soldDeals.length + passedDeals.length;
    const winRate = decidedCount > 0 ? (soldDeals.length / decidedCount) * 100 : null;
    const realizedProfit = soldDeals.reduce((s, d) => s + (d.profit || 0), 0);
    const avgSoldMargin = soldDeals.length > 0
        ? soldDeals.reduce((s, d) => s + (d.margin || 0), 0) / soldDeals.length
        : null;

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            {/* Aggregate stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl shadow-md p-4 text-center">
                    <p className="text-xs font-medium text-slate-500 mb-1">Logged</p>
                    <p className="text-3xl font-bold text-slate-800">{dealHistory.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4 text-center">
                    <p className="text-xs font-medium text-slate-500 mb-1">Sold</p>
                    <p className="text-3xl font-bold text-emerald-600">{soldDeals.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4 text-center">
                    <p className="text-xs font-medium text-slate-500 mb-1">Win Rate</p>
                    <p className="text-3xl font-bold text-slate-800">
                        {winRate !== null ? `${Math.round(winRate)}%` : '—'}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4 text-center">
                    <p className="text-xs font-medium text-slate-500 mb-1">Realized Profit</p>
                    <p className={`text-3xl font-bold ${realizedProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {fmtUSD(realizedProfit)}
                    </p>
                </div>
            </div>

            {/* Insight callout */}
            {soldDeals.length > 0 && avgSoldMargin !== null && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 font-medium text-center">
                    🏆 {soldDeals.length} sold · avg margin {avgSoldMargin.toFixed(1)}%{winRate !== null ? ` · ${Math.round(winRate)}% win rate` : ''}
                </div>
            )}

            {/* Deal list */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden divide-y divide-slate-100">
                {dealHistory.map(deal => {
                    const rawDate = deal.loggedAt?.toDate ? deal.loggedAt.toDate() : new Date();
                    const dateStr = rawDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const marginColor = deal.margin >= 20 ? 'text-emerald-600' : deal.margin >= 10 ? 'text-amber-600' : 'text-red-500';
                    const status = deal.status || 'listed';
                    const statusMeta = STATUS_META[status];
                    const isPickerOpen = activeStatusId === deal.id;

                    return (
                        <div key={deal.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                {/* Margin dot */}
                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${deal.margin >= 20 ? 'bg-emerald-500' : deal.margin >= 10 ? 'bg-amber-400' : 'bg-red-400'}`} />

                                {/* Item info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-slate-800 truncate">{deal.itemName}</p>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">{deal.platformName}</span>
                                        {/* Status badge */}
                                        <button
                                            onClick={() => setActiveStatusId(isPickerOpen ? null : deal.id)}
                                            className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 transition-colors ${statusMeta.pill} hover:opacity-80`}
                                        >
                                            {statusMeta.label} ▾
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">{dateStr} · {fmtUSD(deal.salePrice)}</p>
                                </div>

                                {/* Profit + margin */}
                                <div className="text-right flex-shrink-0">
                                    <p className={`font-bold ${deal.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtUSD(deal.profit)}</p>
                                    <p className={`text-xs font-semibold ${marginColor}`}>{deal.margin?.toFixed(1)}%</p>
                                </div>

                                {/* Delete — two-step confirm */}
                                {pendingDeleteId === deal.id ? (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => { onDeleteDeal(deal.id); setPendingDeleteId(null); }}
                                            className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => setPendingDeleteId(null)}
                                            className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setPendingDeleteId(deal.id)}
                                        className="text-slate-300 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                                        title="Remove from history"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Status picker — inline, appears below row */}
                            {isPickerOpen && (
                                <div className="mt-2.5 ml-5 flex items-center gap-2 flex-wrap">
                                    {Object.entries(STATUS_META).map(([key, meta]) => (
                                        <button
                                            key={key}
                                            onClick={() => { onUpdateStatus(deal.id, key); setActiveStatusId(null); }}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${status === key ? meta.active + ' border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                                        >
                                            {meta.label}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setActiveStatusId(null)}
                                        className="text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function AuthModal({ onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const friendlyError = (err) => {
        const code = err.code || '';
        if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Incorrect email or password.';
        if (code === 'auth/email-already-in-use') return 'An account with this email already exists.';
        if (code === 'auth/weak-password') return 'Password must be at least 6 characters.';
        if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
        if (code === 'auth/network-request-failed') return 'No connection. Check your internet and try again.';
        return err.message.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]+\)\.?/, '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            onClose();
        } catch (err) {
            setError(friendlyError(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X className="w-6 h-6" /></button>
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">{isLogin ? 'Log In' : 'Create Account'}</h2>
                <p className="text-center text-slate-500 mb-6 text-sm">Save your products and calculations.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input id="email" label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    <Input id="password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 font-semibold bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow disabled:opacity-60">
                        {isSubmitting && <Spinner className="w-5 h-5" />}
                        {isSubmitting ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>
                <p className="text-center text-sm text-slate-500 mt-6">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-semibold text-emerald-600 hover:underline ml-1">
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
}
