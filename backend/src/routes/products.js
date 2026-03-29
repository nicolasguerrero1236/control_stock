import { Router } from 'express';

import {
  getProducts,
  patchProductStock,
  postProduct,
  putProduct,
  removeProduct
} from '../controllers/productsController.js';

export const productsRouter = Router();

productsRouter.get('/', getProducts);
productsRouter.post('/', postProduct);
productsRouter.put('/:id', putProduct);
productsRouter.patch('/:id/stock', patchProductStock);
productsRouter.delete('/:id', removeProduct);