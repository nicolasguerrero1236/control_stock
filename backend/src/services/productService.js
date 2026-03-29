import { getFirestore } from '../config/firestore.js';
import { sendStockAlert } from './emailService.js';
import { getThreshold, shouldAlert } from '../config/stockThresholds.js';

const COLLECTION_NAME = 'products';

function mapProductDocument(documentSnapshot) {
  const data = documentSnapshot.data();

  return {
    id: documentSnapshot.id,
    name: data.name,
    category: data.category,
    stock: data.stock,
    minimumStock: data.minimumStock,
    unit: data.unit,
    lowStockAlertSent: Boolean(data.lowStockAlertSent),
    updatedAt: data.updatedAt
  };
}

async function syncLowStockAlert(documentReference, product) {
  const isCriticalStock = shouldAlert(product.category, product.stock);
  const alertAlreadySent = Boolean(product.lowStockAlertSent);

  if (!isCriticalStock) {
    if (alertAlreadySent) {
      await documentReference.update({ lowStockAlertSent: false });
      return { ...product, lowStockAlertSent: false };
    }

    return product;
  }

  if (alertAlreadySent) {
    return product;
  }

  const threshold = getThreshold(product.category);
  const alertSent = await sendStockAlert(product.name, product.category, product.stock, threshold);

  if (alertSent) {
    await documentReference.update({ lowStockAlertSent: true });
    return { ...product, lowStockAlertSent: true };
  }

  return product;
}

function validateProductPayload(payload, { partial = false } = {}) {
  const name = payload.name?.trim();
  const category = payload.category?.trim();
  const unit = payload.unit?.trim() || 'unidades';
  const stock = payload.stock;
  const minimumStock = payload.minimumStock;

  if (!partial || Object.hasOwn(payload, 'name')) {
    if (!name) {
      const error = new Error('El nombre del producto es obligatorio.');
      error.statusCode = 400;
      throw error;
    }
  }

  if (!partial || Object.hasOwn(payload, 'category')) {
    if (!category) {
      const error = new Error('La categoria del producto es obligatoria.');
      error.statusCode = 400;
      throw error;
    }
  }

  if (!partial || Object.hasOwn(payload, 'stock')) {
    if (!Number.isInteger(stock) || stock < 0) {
      const error = new Error('El stock debe ser un numero entero mayor o igual a 0.');
      error.statusCode = 400;
      throw error;
    }
  }

  if (!partial || Object.hasOwn(payload, 'minimumStock')) {
    if (!Number.isInteger(minimumStock) || minimumStock < 0) {
      const error = new Error('El stock minimo debe ser un numero entero mayor o igual a 0.');
      error.statusCode = 400;
      throw error;
    }
  }

  return {
    ...(name ? { name } : {}),
    ...(category ? { category } : {}),
    ...(Object.hasOwn(payload, 'stock') ? { stock } : {}),
    ...(Object.hasOwn(payload, 'minimumStock') ? { minimumStock } : {}),
    ...(unit ? { unit } : {})
  };
}

export async function listProducts() {
  const firestore = getFirestore();
  const snapshot = await firestore.collection(COLLECTION_NAME).orderBy('name', 'asc').get();

  return snapshot.docs.map(mapProductDocument);
}

export async function createProduct(payload) {
  const firestore = getFirestore();
  const validatedProduct = validateProductPayload(payload);
  const documentReference = await firestore.collection(COLLECTION_NAME).add({
    ...validatedProduct,
    lowStockAlertSent: false,
    updatedAt: new Date().toISOString()
  });

  const savedProduct = await documentReference.get();
  const product = mapProductDocument(savedProduct);

  return syncLowStockAlert(documentReference, product);
}

export async function updateProduct(productId, payload) {
  const firestore = getFirestore();
  const documentReference = firestore.collection(COLLECTION_NAME).doc(productId);
  const documentSnapshot = await documentReference.get();

  if (!documentSnapshot.exists) {
    const error = new Error('Producto no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  const validatedProduct = validateProductPayload(payload, { partial: true });

  await documentReference.update({
    ...validatedProduct,
    updatedAt: new Date().toISOString()
  });

  const updated = mapProductDocument(await documentReference.get());

  return syncLowStockAlert(documentReference, updated);
}

export async function adjustProductStock(productId, quantityChange) {
  if (!Number.isInteger(quantityChange)) {
    const error = new Error('La variacion de stock debe ser un numero entero.');
    error.statusCode = 400;
    throw error;
  }

  const firestore = getFirestore();
  const documentReference = firestore.collection(COLLECTION_NAME).doc(productId);

  // Se usa una transaccion para evitar inconsistencias si varios dispositivos modifican el mismo producto al mismo tiempo.
  const transactionResult = await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(documentReference);

    if (!snapshot.exists) {
      const error = new Error('Producto no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    const product = snapshot.data();
    const nextStock = product.stock + quantityChange;
    const nextLowStockAlertSent = shouldAlert(product.category, nextStock)
      ? Boolean(product.lowStockAlertSent)
      : false;

    if (nextStock < 0) {
      const error = new Error('La operacion dejaria el stock en un valor negativo.');
      error.statusCode = 400;
      throw error;
    }

    transaction.update(documentReference, {
      stock: nextStock,
      lowStockAlertSent: nextLowStockAlertSent,
      updatedAt: new Date().toISOString()
    });

    return {
      product: {
        id: snapshot.id,
        ...product,
        stock: nextStock,
        lowStockAlertSent: nextLowStockAlertSent,
        updatedAt: new Date().toISOString()
      },
      shouldSendAlert: shouldAlert(product.category, nextStock) && !Boolean(product.lowStockAlertSent)
    };
  });

  let updatedProduct = transactionResult.product;

  if (transactionResult.shouldSendAlert) {
    const threshold = getThreshold(updatedProduct.category);
    const alertSent = await sendStockAlert(
      updatedProduct.name,
      updatedProduct.category,
      updatedProduct.stock,
      threshold
    );

    if (alertSent) {
      await documentReference.update({ lowStockAlertSent: true });
      updatedProduct = { ...updatedProduct, lowStockAlertSent: true };
    }
  }

  return updatedProduct;
}

export async function deleteProduct(productId) {
  const firestore = getFirestore();
  const documentReference = firestore.collection(COLLECTION_NAME).doc(productId);
  const snapshot = await documentReference.get();

  if (!snapshot.exists) {
    const error = new Error('Producto no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  await documentReference.delete();
}