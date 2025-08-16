import React, { useState, useEffect } from 'react';
// --- Official Firebase Imports ---
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


// =================================================================================
// PASTE YOUR FIREBASE CONFIGURATION HERE
// =================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyB4z-JrEmvqtzshnsvEO_wTWWQ-eId5MOo",
  authDomain: "dropship-profit-calculator.firebaseapp.com",
  projectId: "dropship-profit-calculator",
  storageBucket: "dropship-profit-calculator.firebasestorage.app",
  messagingSenderId: "12386923384",
  appId: "1:12386923384:web:38891fd0cd2cb12badce8d",
  measurementId: "G-5X8WP42KQ8"
};
// =================================================================================


// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- ICONS ---
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

// --- UTILITY FUNCTIONS ---
const fmtUSD = (n) => (isFinite(n) ? n : 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const roundNickel = (n) => Number((Math.round(n / 0.05) * 0.05).toFixed(2));
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const createBlankProduct = () => ({
    name: 'Untitled Product',
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

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const selectedProductData = products.find(p => p.id === selectedProductId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      setUser(currentUser);
      if (currentUser) {
        const productsCollection = collection(db, 'users', currentUser.uid, 'products');
        const q = query(productsCollection, orderBy("createdAt", "desc"));
        const productSnapshot = await getDocs(q);
        const userProducts = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveProduct = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!selectedProductData || selectedProductData.id === 'anonymous') return;
    
    const { id, ...dataToSave } = selectedProductData;
    const productDoc = doc(db, 'users', user.uid, 'products', id);
    await updateDoc(productDoc, dataToSave);
    alert('Product Saved!');
  };

  const handleAddNewProduct = async () => {
    if (!user) return;
    const productsCollection = collection(db, 'users', user.uid, 'products');
    const newProductData = createBlankProduct();
    const docRef = await addDoc(productsCollection, newProductData);
    const newProduct = { id: docRef.id, ...newProductData };
    setProducts([newProduct, ...products]);
    setSelectedProductId(docRef.id);
  };

  const handleDeleteProduct = async (productId) => {
    if (!user || products.length <= 1) return;
    const productDoc = doc(db, 'users', user.uid, 'products', productId);
    await deleteDoc(productDoc);
    const newProducts = products.filter(p => p.id !== productId);
    setProducts(newProducts);
    setSelectedProductId(newProducts[0]?.id || null);
  };

  const handleProductChange = (field, value) => {
    if (!selectedProductData) return;

    const updatedFields = { [field]: value };
    const costFields = ['landed', 'ship', 'pack', 'feePct', 'feeFlat'];

    if (costFields.includes(field)) {
        const currentProduct = { ...selectedProductData, ...updatedFields };
        const { landed, ship, pack, feePct, feeFlat } = currentProduct;
        
        const totalCost = landed + ship + pack;
        const f = feePct / 100;
        const targetMargin = 0.33;
        const denom = 1 - f - targetMargin;

        if (denom > 0) {
            const suggestedPrice = roundNickel((totalCost + feeFlat) / denom);
            updatedFields.price = suggestedPrice;
            updatedFields.minPrice = Math.round(suggestedPrice * 0.5);
            updatedFields.maxPrice = Math.round(suggestedPrice * 2);
        }
    }

    const updatedProduct = { ...selectedProductData, ...updatedFields };
    setProducts(products.map(p => p.id === selectedProductId ? updatedProduct : p));
  };
  
  const handlePriceChange = (newPrice) => {
      if (!selectedProductData) return;
      const min = selectedProductData.minPrice;
      const max = selectedProductData.maxPrice;
      const clampedPrice = roundNickel(clamp(newPrice, min, max));
      handleProductChange('price', clampedPrice);
  }

  if (isLoading) {
    return <div className="w-full h-screen flex items-center justify-center bg-slate-100"><p>Loading Profit Engine...</p></div>
  }

  return (
    <div className="bg-slate-100 min-h-screen font-sans">
      <Header user={user} onLoginClick={() => setAuthModalOpen(true)} />
      
      <main className="p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {user && (
            <ProductSidebar 
              products={products}
              selectedProductId={selectedProductId}
              onSelectProduct={setSelectedProductId}
              onAddProduct={handleAddNewProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}
          <div className={user ? "lg:col-span-3" : "lg:col-span-4"}>
             {selectedProductData ? (
                <div className="space-y-6">
                    <Calculator 
                      product={selectedProductData} 
                      onProductChange={handleProductChange}
                      onPriceChange={handlePriceChange}
                      onSave={handleSaveProduct}
                      user={user}
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
      </main>
      {isAuthModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
    </div>
  );
}

// --- SUB-COMPONENTS ---
function Header({ user, onLoginClick }) {
  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256" className="text-teal-600"><path fill="currentColor" d="M244 56.7a15.9 15.9 0 0 0-10.5-4.4c-2.4-.2-111.2-1-111.2-1s-108.8.8-111.2 1a15.9 15.9 0 0 0-10.5 4.4A16.1 16.1 0 0 0 12 67.3v121.4a16.1 16.1 0 0 0 8.6 14.6a15.9 15.9 0 0 0 15.4 0l106.2-53.1l106.2 53.1a15.9 15.9 0 0 0 15.4 0a16.1 16.1 0 0 0 8.6-14.6V67.3a16.1 16.1 0 0 0-8-10.6ZM128 140.5L28 192V64l100 50v26.5Zm100 51.5L132 142.8V114l100-50v128Z"/></svg>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Profit Engine</h1>
      </div>
      <div>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden md:block">Welcome, {user.email}</span>
            <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="hidden md:block">Logout</span>
            </button>
          </div>
        ) : (
          <button onClick={onLoginClick} className="flex items-center gap-2 text-sm font-semibold bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow">
            <LogIn className="w-5 h-5" />
            Login / Sign Up
          </button>
        )}
      </div>
    </header>
  );
}

function ProductSidebar({ products, selectedProductId, onSelectProduct, onAddProduct, onDeleteProduct }) {
  return (
    <aside className="lg:col-span-1 bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-lg font-bold text-slate-800 mb-4">My Products</h2>
      <div className="space-y-2">
        {products.map(product => (
          <div
            key={product.id}
            onClick={() => onSelectProduct(product.id)}
            className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedProductId === product.id ? 'bg-teal-100 text-teal-800' : 'hover:bg-slate-100'}`}
          >
            <span className="font-semibold truncate pr-2">{product.name || 'Untitled Product'}</span>
            {products.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); onDeleteProduct(product.id); }} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button onClick={onAddProduct} className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors py-2 rounded-lg hover:bg-teal-50">
        <PlusCircle className="w-5 h-5" />
        Add New Product
      </button>
    </aside>
  );
}

// --- PASTE THIS ENTIRE UPDATED COMPONENT INTO src/App.js ---

function Calculator({ product, onProductChange, onPriceChange, onSave, user }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Input id="name" label="Product Name" value={product.name} onChange={e => onProductChange('name', e.target.value)} />
                <Input id="landed" label="Landed Cost" type="number" value={product.landed} onChange={e => onProductChange('landed', parseFloat(e.target.value) || 0)} icon="$" />
                <Input id="ship" label="Shipping Cost" type="number" value={product.ship} onChange={e => onProductChange('ship', parseFloat(e.target.value) || 0)} icon="$" />
                <Input id="pack" label="Packaging Cost" type="number" value={product.pack} onChange={e => onProductChange('pack', parseFloat(e.target.value) || 0)} icon="$" />
                <Input id="feePct" label="Marketplace Fee" type="number" value={product.feePct} onChange={e => onProductChange('feePct', parseFloat(e.target.value) || 0)} icon="%" />
                <Input id="feeFlat" label="Flat Fee" type="number" value={product.feeFlat} onChange={e => onProductChange('feeFlat', parseFloat(e.target.value) || 0)} icon="$" />
            </div>
            <hr className="my-6 border-slate-200" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                    {/* === MODIFIED SECTION START === */}
                    <div className="text-center">
                        <label htmlFor="salePriceInput" className="text-sm font-medium text-slate-600">Sale Price</label>
                        <div className="mt-1 relative">
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3 text-2xl text-slate-500">$</span>
                            <input 
                                type="number"
                                id="salePriceInput"
                                value={product.price}
                                onChange={e => onPriceChange(parseFloat(e.target.value) || 0)}
                                className="w-full text-center text-4xl font-bold text-teal-700 bg-transparent border-none focus:ring-0"
                                step="0.05"
                            />
                        </div>
                    </div>
                    {/* === MODIFIED SECTION END === */}
                    <div className="flex items-center gap-4 mt-4">
                        <button onClick={() => onPriceChange(product.price - 0.05)} className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 transition">-</button>
                        <input type="range" min={product.minPrice} max={product.maxPrice} step="0.05" value={product.price} onChange={e => onPriceChange(parseFloat(e.target.value))} className="w-full" />
                        <button onClick={() => onPriceChange(product.price + 0.05)} className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 transition">+</button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input id="minPrice" label="Min Price" type="number" value={product.minPrice} onChange={e => onProductChange('minPrice', parseInt(e.target.value, 10) || 0)} icon="$" step="1" />
                    <Input id="maxPrice" label="Max Price" type="number" value={product.maxPrice} onChange={e => onProductChange('maxPrice', parseInt(e.target.value, 10) || 0)} icon="$" step="1" />
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={onSave} className="flex items-center gap-2 font-semibold bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors shadow">
                    <Save className="w-5 h-5" />
                    {user ? 'Save Changes' : 'Save & Sign Up'}
                </button>
            </div>
        </div>
    );
}

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

    const handleMarginButtonClick = (margin) => {
        const targetPrice = priceForMargin(margin);
        if(!isNaN(targetPrice)) {
            onPriceChange(targetPrice);
        }
    };
    
    const margins = [0.10, 0.15, 0.20, 0.25, 0.33, 0.40, 0.50, 0.75];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Quick Targets */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Quick Targets</h3>
                        <p className="text-sm text-slate-500 mb-4">Instantly set price for a target margin.</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {margins.map(margin => (
                                <button key={margin} onClick={() => handleMarginButtonClick(margin)} className="text-sm font-semibold p-3 bg-slate-100 rounded-lg hover:bg-teal-100 hover:text-teal-800 transition-colors">
                                    {Math.round(margin * 100)}%
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Strategic Analysis */}
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
                                    <StrategyButton
                                        label="Price to Beat"
                                        newPrice={competitorPrice - 0.50}
                                        profit={calculateProfit(competitorPrice - 0.50)}
                                        onClick={onPriceChange}
                                    />
                                    <StrategyButton
                                        label="Price to Match"
                                        newPrice={competitorPrice}
                                        profit={calculateProfit(competitorPrice)}
                                        onClick={onPriceChange}
                                    />
                                    <StrategyButton
                                        label="Price for Premium"
                                        newPrice={competitorPrice * 1.05}
                                        profit={calculateProfit(competitorPrice * 1.05)}
                                        onClick={onPriceChange}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <StatCard label="Net Profit" value={fmtUSD(profit)} isPositive={profit >= 0} />
            <StatCard label="Net Margin" value={`${(price > 0 ? (profit / price) * 100 : 0).toFixed(1)}%`} isPositive={profit >= 0} />
            <StatCard label="Breakeven Price" value={fmtUSD((1 - feePct / 100) > 0 ? (totalCost + feeFlat) / (1 - feePct / 100) : Infinity)} />
        </div>
    );
}

function StrategyButton({ label, newPrice, profit, onClick }) {
    const roundedPrice = roundNickel(newPrice);
    return (
        <button onClick={() => onClick(roundedPrice)} className="w-full text-left p-3 bg-slate-100 rounded-lg hover:bg-teal-100 hover:text-teal-800 transition-colors">
            <div className="font-semibold">{label}</div>
            <div className="text-xs text-slate-600">
                Set Price: <span className="font-bold">{fmtUSD(roundedPrice)}</span> | Profit: <span className="font-bold">{fmtUSD(profit)}</span>
            </div>
        </button>
    );
}

function Input({ id, label, type = "text", value, onChange, icon, step }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <div className="relative">
        {icon && <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">{icon}</span>}
        <input type={type} id={id} value={value} onChange={onChange} step={step || (type === 'number' ? '0.01' : undefined)} className={`w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 transition ${icon ? 'pl-8' : 'pl-3'}`} />
      </div>
    </div>
  );
}

function StatCard({ label, value, isPositive }) {
    const valueColor = isPositive === true ? 'text-green-600' : isPositive === false ? 'text-red-500' : 'text-slate-800';
    return (
        <div className="bg-white p-4 rounded-xl shadow-md text-center">
            <h3 className="text-sm font-medium text-slate-500">{label}</h3>
            <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
        </div>
    );
}

function AuthModal({ onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            onClose();
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">{isLogin ? 'Log In' : 'Create Account'}</h2>
                <p className="text-center text-slate-500 mb-6">to save your products and calculations.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input id="email" label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    <Input id="password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full font-semibold bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition-colors shadow">{isLogin ? 'Log In' : 'Sign Up'}</button>
                </form>
                <p className="text-center text-sm text-slate-500 mt-6">
                    {isLogin ? "Don't have an account?  Make one!" : "Already have an account? Welcome Back!"}
                    <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-teal-600 hover:underline ml-1">{isLogin ? 'Sign Up' : 'Log In'}</button>
                </p>
            </div>
        </div>
    );
}
