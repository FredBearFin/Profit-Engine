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
    orderBy
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
// feePct = percentage fee, feeFlat = flat fee per transaction
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

const createBlankProduct = () => ({
    name: 'Untitled Product',
    platform: 'custom',
    landed: 5.00,
    ship: 3.50,
    pack: 0.50,
    feePct: 15,
    feeFlat: 0.00,
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
  const [mode, setMode] = useState('calculator'); // 'calculator' | 'quickflip'
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
        } else {
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

  const handleSaveProduct = async () => {
    if (!user) { setAuthModalOpen(true); return; }
    if (!selectedProductData || selectedProductData.id === 'anonymous') return;
    setIsSaving(true);
    try {
      const { id, ...dataToSave } = selectedProductData;
      const productDoc = doc(db, 'users', user.uid, 'products', id);
      await updateDoc(productDoc, dataToSave);
      showToast('Product saved!');
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
    const costFields = ['landed', 'ship', 'pack', 'feePct', 'feeFlat'];
    if (costFields.includes(field)) {
      const current = { ...selectedProductData, ...updatedFields };
      const totalCost = current.landed + current.ship + current.pack;
      const f = current.feePct / 100;
      const denom = 1 - f - 0.33;
      if (denom > 0) {
        const suggested = roundNickel((totalCost + current.feeFlat) / denom);
        updatedFields.price = suggested;
        updatedFields.minPrice = Math.round(suggested * 0.5);
        updatedFields.maxPrice = Math.round(suggested * 2);
      }
    }
    const updated = { ...selectedProductData, ...updatedFields };
    setProducts(products.map(p => p.id === selectedProductId ? updated : p));
  };

  // Batch-update fees + recalculate price when a platform preset is selected
  const handlePlatformSelect = (platformKey) => {
    const platform = PLATFORMS.find(p => p.key === platformKey);
    if (!platform || !selectedProductData) return;
    const { landed, ship, pack } = selectedProductData;
    const totalCost = landed + ship + pack;
    const f = platform.feePct / 100;
    const denom = 1 - f - 0.33;
    const updatedFields = { platform: platformKey, feePct: platform.feePct, feeFlat: platform.feeFlat };
    if (denom > 0) {
      const suggested = roundNickel((totalCost + platform.feeFlat) / denom);
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
        {/* Mode toggle — always visible at top */}
        <div className="flex gap-1.5 mb-6 bg-white p-1.5 rounded-xl shadow-sm max-w-sm">
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
        </div>

        {mode === 'quickflip' ? (
          <QuickFlip />
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
                  <StrategyPanel
                    product={selectedProductData}
                    onPriceChange={handlePriceChange}
                    onProductChange={handleProductChange}
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

    useEffect(() => { setSalePriceInput(product.price); }, [product.price]);

    const handleSalePriceInputCommit = () => {
        let val = parseFloat(salePriceInput);
        if (isNaN(val)) val = product.minPrice;
        const clamped = roundNickel(clamp(val, product.minPrice, product.maxPrice));
        setSalePriceInput(clamped);
        onPriceChange(clamped);
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            {/* Platform preset selector */}
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
                {/* Show the note for the selected platform */}
                {(() => {
                    const sel = PLATFORMS.find(p => p.key === (product.platform || 'custom'));
                    return sel?.note ? <p className="text-xs text-slate-400 mt-1.5">{sel.note}</p> : null;
                })()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Input id="name" label="Product Name" value={product.name} onChange={e => onProductChange('name', e.target.value)} ref={productNameInputRef} />
                <Input id="landed" label="Landed Cost" type="number" value={product.landed} onChange={e => onProductChange('landed', parseFloat(e.target.value) || 0)} icon="$" />
                <Input id="ship" label="Shipping Cost" type="number" value={product.ship} onChange={e => onProductChange('ship', parseFloat(e.target.value) || 0)} icon="$" />
                <Input id="pack" label="Packaging Cost" type="number" value={product.pack} onChange={e => onProductChange('pack', parseFloat(e.target.value) || 0)} icon="$" />
                <Input id="feePct" label="Marketplace Fee %" type="number" value={product.feePct} onChange={e => onProductChange('feePct', parseFloat(e.target.value) || 0)} icon="%" />
                <Input id="feeFlat" label="Flat Fee" type="number" value={product.feeFlat} onChange={e => onProductChange('feeFlat', parseFloat(e.target.value) || 0)} icon="$" />
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

// --- Quick Flip Mode ---
// Stripped-down calculator for fast in-store decisions. No Firebase, fully local.
function QuickFlip() {
    const [cost, setCost] = useState('');
    const [price, setPrice] = useState('');
    const [platformKey, setPlatformKey] = useState('ebay');

    const platform = PLATFORMS.find(p => p.key === platformKey);
    const costNum = parseFloat(cost) || 0;
    const priceNum = parseFloat(price) || 0;
    const hasValues = costNum > 0 && priceNum > 0;

    const fees = priceNum * (platform.feePct / 100) + platform.feeFlat;
    const profit = priceNum - costNum - fees;
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
            {/* Platform selector */}
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
                {platform?.note && (
                    <p className="text-xs text-slate-400 mt-2.5 text-center">{platform.note}</p>
                )}
            </div>

            {/* Cost + Price inputs */}
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 space-y-5">
                <BigInput label="What did you pay?" value={cost} onChange={setCost} />
                <BigInput label="What's it selling for?" value={price} onChange={setPrice} />
            </div>

            {/* Verdict */}
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
                </div>
            ) : (
                <p className="text-center text-slate-400 text-sm py-6">
                    Enter your cost and the sale price above.
                </p>
            )}
        </div>
    );
}

// --- Big number input for Quick Flip ---
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
function StrategyPanel({ product, onPriceChange, onProductChange }) {
    const { landed, ship, pack, feePct, feeFlat, price, competitorPrice } = product;
    const totalCost = landed + ship + pack;
    const calculateProfit = (p) => p - totalCost - (p * (feePct / 100) + feeFlat);
    const profit = calculateProfit(price);

    const priceForMargin = (targetMargin) => {
      const f = feePct / 100;
      const denom = 1 - f - targetMargin;
      if (denom <= 0) return NaN;
      return roundNickel((totalCost + feeFlat) / denom);
    };

    const margins = [0.10, 0.15, 0.20, 0.25, 0.33, 0.40, 0.50, 0.75];

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
                                    <StrategyButton label="Price to Beat"    newPrice={competitorPrice - 0.50}   profit={calculateProfit(competitorPrice - 0.50)}   onClick={onPriceChange} />
                                    <StrategyButton label="Price to Match"   newPrice={competitorPrice}           profit={calculateProfit(competitorPrice)}           onClick={onPriceChange} />
                                    <StrategyButton label="Price for Premium" newPrice={competitorPrice * 1.05}  profit={calculateProfit(competitorPrice * 1.05)}    onClick={onPriceChange} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <StatCard label="Net Profit"      value={fmtUSD(profit)} isPositive={profit >= 0} />
            <StatCard label="Net Margin"      value={`${(price > 0 ? (profit / price) * 100 : 0).toFixed(1)}%`} isPositive={profit >= 0} />
            <StatCard label="Breakeven Price" value={fmtUSD((1 - feePct / 100) > 0 ? (totalCost + feeFlat) / (1 - feePct / 100) : Infinity)} />
        </div>
    );
}

// --- Strategy Button ---
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

// --- Input ---
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

// --- Stat Card ---
function StatCard({ label, value, isPositive }) {
    const valueColor = isPositive === true ? 'text-green-600' : isPositive === false ? 'text-red-500' : 'text-slate-800';
    return (
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <h3 className="text-sm font-medium text-slate-500">{label}</h3>
            <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
        </div>
    );
}

// --- Auth Modal ---
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
