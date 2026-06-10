// filepath: primemart/app.js
// PrimeMart - Main Application Logic

// ===== Firebase Imports =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ===== Firebase Configuration =====
const firebaseConfig = {
  apiKey: "AIzaSyDaVAcwsRzVZDZY7FVURwZdcSZMa035EMQ",
  authDomain: "primemart-49775.firebaseapp.com",
  projectId: "primemart-49775",
  storageBucket: "primemart-49775.firebasestorage.app",
  messagingSenderId: "109416987490",
  appId: "1:109416987490:web:7aa73e3472651147220a3b",
  measurementId: "G-RGCX2ZQQZE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== Global State =====
let currentUser = null;
let products = [];
let cartItems = [];
let currentCategory = 'all';

// ===== Toast Notifications =====
function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ===== Authentication Functions =====
async function registerUser(name, email, password, phone) {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      phone,
      createdAt: serverTimestamp()
    });

    showToast('Registration successful! Welcome to PrimeMart.');
    
    // Redirect to home page after registration
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
    
    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    let message = 'Registration failed. Please try again.';
    if (error.code === 'auth/email-already-in-use') {
      message = 'This email is already registered.';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password should be at least 6 characters.';
    }
    showToast(message, 'error');
    return { success: false, error };
  }
}

async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    showToast('Login successful!');
    
    // Redirect to home page after login
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Login error:', error);
    let message = 'Login failed. Please check your credentials.';
    if (error.code === 'auth/user-not-found') {
      message = 'No account found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      message = 'Incorrect password.';
    }
    showToast(message, 'error');
    return { success: false, error };
  }
}

async function saveUserProfile(user) {
  if (!user) return;
  try {
    const providerData = user.providerData && user.providerData[0] ? user.providerData[0] : {};
    await setDoc(doc(db, 'users', user.uid), {
      name: user.displayName || providerData.displayName || '',
      email: user.email || providerData.email || '',
      phone: user.phoneNumber || providerData.phoneNumber || '',
      providerId: providerData.providerId || '',
      lastLoginAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
}

async function signInWithProvider(provider) {
  try {
    const result = await signInWithPopup(auth, provider);
    await saveUserProfile(result.user);
    showToast('Login successful!');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Social login error:', error);
    let message = 'Social login failed. Please try again.';
    if (error.code === 'auth/popup-closed-by-user') {
      message = 'Login popup closed before completion.';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      message = 'An account already exists with a different sign-in method.';
    }
    showToast(message, 'error');
    return { success: false, error };
  }
}

function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithProvider(provider);
}

function signInWithFacebook() {
  const provider = new FacebookAuthProvider();
  return signInWithProvider(provider);
}

function signInWithTwitter() {
  const provider = new TwitterAuthProvider();
  return signInWithProvider(provider);
}

async function logoutUser() {
  try {
    await signOut(auth);
    currentUser = null;
    cartItems = [];
    showToast('Logged out successfully.');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Logout failed.', 'error');
  }
}

// ===== Auth State Observer =====
function initAuthState() {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    updateAuthUI();
    if (user) {
      await loadCart();
      // Re-render cart page if we're on cart page
      if (document.getElementById('cart-items')) {
        renderCartPage();
      }
    }
  });
}

function updateAuthUI() {
  const authLinks = document.getElementById('auth-links');
  const userMenu = document.getElementById('user-menu');
  const cartBadge = document.getElementById('cart-badge');

  if (!authLinks || !userMenu) return;

  if (currentUser) {
    authLinks.style.display = 'none';
    userMenu.style.display = 'flex';
    
    // Update user name
    const userNameEl = document.getElementById('user-name');
    if (userNameEl && currentUser.email) {
      userNameEl.textContent = currentUser.email.split('@')[0];
    }

    // Update cart badge
    if (cartBadge) {
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      cartBadge.textContent = totalItems;
      cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
  } else {
    authLinks.style.display = 'flex';
    userMenu.style.display = 'none';
  }
}

// ===== Products Functions =====
async function loadProducts(category = 'all') {
  try {
    const productsContainer = document.getElementById('products-grid');
    if (!productsContainer) return;

    productsContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    let q = collection(db, 'products');
    if (category !== 'all') {
      q = query(collection(db, 'products'), where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // If no products in Firestore, use demo products
    if (products.length === 0) {
      console.log('No products in Firestore, using demo products');
      products = getDemoProducts();
    }
    
    renderProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    // If Firestore fails, show demo products
    products = getDemoProducts();
    renderProducts(products);
  }
}

function getDemoProducts() {
  return [
    { id: '1', name: 'Wireless Headphones', price: 79.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
    { id: '2', name: 'Smart Watch', price: 199.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
    { id: '3', name: 'Running Shoes', price: 89.99, category: 'Sports', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
    { id: '4', name: 'Cotton T-Shirt', price: 29.99, category: 'Clothing', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' },
    { id: '5', name: 'Coffee Maker', price: 149.99, category: 'Home', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' },
    { id: '6', name: 'Backpack', price: 59.99, category: 'Accessories', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
    { id: '7', name: 'Sunglasses', price: 129.99, category: 'Accessories', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' },
    { id: '8', name: 'Desk Lamp', price: 45.99, category: 'Home', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400' }
  ];
}

function renderProducts(productsToRender) {
  const container = document.getElementById('products-grid');
  if (!container) return;

  if (productsToRender.length === 0) {
    container.innerHTML = '<div class="empty-state"><h3>No products found</h3><p>Try a different category or check back later.</p></div>';
    return;
  }

  container.innerHTML = productsToRender.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400x200?text=Product'">
      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <button class="btn-add-cart" onclick="addToCart('${product.id}')" ${!currentUser ? 'disabled title="Please login to add to cart"' : ''}>
          Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

// ===== Search Function =====
function searchProducts(searchTerm) {
  const filtered = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  renderProducts(filtered);
}

// ===== Cart Functions =====
async function loadCart() {
  if (!currentUser) return;

  try {
    const cartRef = doc(db, 'carts', currentUser.uid);
    const cartSnap = await getDoc(cartRef);
    
    if (cartSnap.exists()) {
      cartItems = cartSnap.data().items || [];
    } else {
      cartItems = [];
    }
    
    updateCartUI();
  } catch (error) {
    console.error('Error loading cart:', error);
    cartItems = [];
  }
}

async function addToCart(productId) {
  if (!currentUser) {
    showToast('Please login to add items to cart.', 'error');
    window.location.href = 'auth.html';
    return;
  }

  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cartItems.find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      quantity: 1
    });
  }

  await saveCart();
  showToast(`${product.name} added to cart!`);
  updateCartUI();
}

async function removeFromCart(productId) {
  cartItems = cartItems.filter(item => item.productId !== productId);
  await saveCart();
  showToast('Item removed from cart.');
  updateCartUI();
}

async function updateQuantity(productId, change) {
  const item = cartItems.find(item => item.productId === productId);
  if (!item) return;

  item.quantity += change;
  
  if (item.quantity <= 0) {
    await removeFromCart(productId);
    return;
  }

  await saveCart();
  updateCartUI();
}

async function saveCart() {
  if (!currentUser) return;

  try {
    await setDoc(doc(db, 'carts', currentUser.uid), {
      userId: currentUser.uid,
      items: cartItems,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving cart:', error);
  }
}

function getCartTotal() {
  return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function updateCartUI() {
  const cartBadge = document.getElementById('cart-badge');
  if (cartBadge) {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
  }
}

// ===== Order Functions =====
async function checkout() {
  if (!currentUser) {
    showToast('Please login to checkout.', 'error');
    return;
  }

  if (cartItems.length === 0) {
    showToast('Your cart is empty.', 'error');
    return;
  }

  // Store checkout data in sessionStorage for payment page
  const checkoutData = {
    items: cartItems,
    total: getCartTotal(),
    userId: currentUser.uid,
    userEmail: currentUser.email || ''
  };
  sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
  
  // Redirect to payment page
  window.location.href = 'payment.html';
}

// Clear cart after successful payment
async function clearCart() {
  cartItems = [];
  if (currentUser) {
    await saveCart();
  }
  updateCartUI();
}

// ===== Category Filter =====
function filterByCategory(category) {
  currentCategory = category;
  
  // Update active button
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });
  
  loadProducts(category);
}

// ===== Initialize Page =====
function initPage() {
  initAuthState();
  
  // Check if we're on the home page
  if (document.getElementById('products-grid')) {
    loadProducts();
  }
  
  // Setup search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => searchProducts(e.target.value));
  }
  
  // Setup category buttons
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => filterByCategory(btn.dataset.category));
  });
  
  // Show debug button for testing
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.style.display = 'block';
  }
}

// ===== Auth Form Handlers =====
function setupAuthForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');

  if (loginTab && registerTab) {
    loginTab.addEventListener('click', () => {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      if (loginForm) loginForm.classList.add('active');
      if (registerForm) registerForm.classList.remove('active');
    });

    registerTab.addEventListener('click', () => {
      registerTab.classList.add('active');
      loginTab.classList.remove('active');
      if (registerForm) registerForm.classList.add('active');
      if (loginForm) loginForm.classList.remove('active');
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('#login-email').value;
      const password = loginForm.querySelector('#login-password').value;
      await loginUser(email, password);
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = registerForm.querySelector('#register-name').value;
      const email = registerForm.querySelector('#register-email').value;
      const phone = registerForm.querySelector('#register-phone').value;
      const password = registerForm.querySelector('#register-password').value;
      const confirmPassword = registerForm.querySelector('#register-confirm').value;

      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }

      await registerUser(name, email, password, phone);
    });
  }
}

// ===== Cart Page Functions =====
function renderCartPage() {
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartCount = document.getElementById('cart-count');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (!cartItemsContainer) return;

  if (cartItems.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <h3>Your cart is empty</h3>
        <p>Add some products to get started!</p>
        <a href="index.html" class="btn-primary">Continue Shopping</a>
      </div>
    `;
    if (cartTotal) cartTotal.textContent = '$0.00';
    if (cartSubtotal) cartSubtotal.textContent = '$0.00';
    if (cartCount) cartCount.textContent = '0';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  cartItemsContainer.innerHTML = cartItems.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/100x100?text=Product'">
      <div class="cart-item-details">
        <h3 class="cart-item-name">${item.name}</h3>
        <p class="cart-item-category">${item.category}</p>
        <p class="cart-item-price">$${item.price.toFixed(2)}</p>
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="updateQuantity('${item.productId}', -1)">-</button>
          <span class="quantity-value">${item.quantity}</span>
          <button class="quantity-btn" onclick="updateQuantity('${item.productId}', 1)">+</button>
        </div>
      </div>
      <button class="btn-remove" onclick="removeFromCart('${item.productId}')">Remove</button>
    </div>
  `).join('');

  const total = getCartTotal();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  if (cartTotal) cartTotal.textContent = `$${total.toFixed(2)}`;
  if (cartSubtotal) cartSubtotal.textContent = `$${total.toFixed(2)}`;
  if (cartCount) cartCount.textContent = totalItems;
  if (checkoutBtn) checkoutBtn.disabled = false;
}

// ===== Logout Handler =====
function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }
}

// ===== Protect Pages =====
function protectPage() {
  if (!currentUser) {
    window.location.href = 'auth.html';
  }
}

// ===== Export Functions for Global Use =====
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.checkout = checkout;
window.filterByCategory = filterByCategory;
window.clearCart = clearCart;
window.signInWithGoogle = signInWithGoogle;
window.signInWithFacebook = signInWithFacebook;
window.signInWithTwitter = signInWithTwitter;
window.checkFirestoreProducts = async function() {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    console.log('Products in Firestore:', snapshot.size);
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
    });
    alert('Check console for products! Found: ' + snapshot.size);
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  }
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  initPage();
  setupAuthForms();
  setupLogout();
  
  // Render cart if on cart page - wait for auth state
  if (document.getElementById('cart-items')) {
    // Small delay to ensure auth state is processed
    setTimeout(() => {
      renderCartPage();
    }, 500);
  }
});