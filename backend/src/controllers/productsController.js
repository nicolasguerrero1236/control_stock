import {
  adjustProductStock,
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct
} from '../services/productService.js';

export async function getProducts(_request, response, next) {
  try {
    const products = await listProducts();
    response.json(products);
  } catch (error) {
    next(error);
  }
}

export async function postProduct(request, response, next) {
  try {
    const product = await createProduct(request.body);
    response.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

export async function putProduct(request, response, next) {
  try {
    const product = await updateProduct(request.params.id, request.body);
    response.json(product);
  } catch (error) {
    next(error);
  }
}

export async function patchProductStock(request, response, next) {
  try {
    const quantityChange = Number(request.body.quantityChange);
    const product = await adjustProductStock(request.params.id, quantityChange);
    response.json(product);
  } catch (error) {
    next(error);
  }
}

export async function removeProduct(request, response, next) {
  try {
    await deleteProduct(request.params.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}