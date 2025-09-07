// server.js - Servidor proxy para Firebase
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de Firebase Admin usando variables de entorno
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Inicializar Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Endpoint para obtener productos
app.get('/products', async (req, res) => {
  try {
    const { category, dailyDeals } = req.query;
    let productsRef = db.collection('products').where('status', '==', 'active');
    
    if (category && category !== 'all') {
      productsRef = productsRef.where('category', '==', category);
    }
    
    const snapshot = await productsRef.get();
    const products = [];
    
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    // Si se solicitan ofertas del día, limitar a 4 productos
    if (dailyDeals === 'true') {
      res.json(products.slice(0, 4));
    } else {
      res.json(products);
    }
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
});

// Endpoint para agregar productos (si es necesario)
app.post('/products', async (req, res) => {
  try {
    const productData = req.body;
    const docRef = await db.collection('products').add(productData);
    res.json({ id: docRef.id, ...productData });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Error al agregar el producto' });
  }
});

// Endpoint de salud para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
