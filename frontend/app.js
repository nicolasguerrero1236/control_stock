const configuredApiBaseUrl = window.APP_CONFIG?.apiBaseUrl || 'http://localhost:4000/api';
const API_BASE_URL = configuredApiBaseUrl.endsWith('/products')
  ? configuredApiBaseUrl
  : `${configuredApiBaseUrl.replace(/\/$/, '')}/products`;

const elements = {
  form: document.querySelector('#product-form'),
  apiUser: document.querySelector('#api-user'),
  apiPassword: document.querySelector('#api-password'),
  productId: document.querySelector('#product-id'),
  name: document.querySelector('#name'),
  category: document.querySelector('#category'),
  stock: document.querySelector('#stock'),
  minimumStock: document.querySelector('#minimumStock'),
  unit: document.querySelector('#unit'),
  formTitle: document.querySelector('#form-title'),
  submitButton: document.querySelector('#submit-button'),
  cancelEdit: document.querySelector('#cancel-edit'),
  refreshButton: document.querySelector('#refresh-button'),
  tableBody: document.querySelector('#products-table-body'),
  statusMessage: document.querySelector('#status-message'),
  totalProducts: document.querySelector('#total-products'),
  lowStockCount: document.querySelector('#low-stock-count'),
  totalUnits: document.querySelector('#total-units')
};

let productsState = [];

function getAuthHeaders() {
  const username = elements.apiUser.value.trim();
  const password = elements.apiPassword.value;

  if (!username || !password) {
    return {};
  }

  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`
  };
}

function showStatus(message, type = '') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`.trim();
}

function resetForm() {
  elements.form.reset();
  elements.productId.value = '';
  elements.minimumStock.value = 10;
  elements.unit.value = 'unidades';
  elements.formTitle.textContent = 'Agregar producto';
  elements.submitButton.textContent = 'Guardar producto';
  elements.cancelEdit.classList.add('hidden');
}

function fillForm(product) {
  elements.productId.value = product.id;
  elements.name.value = product.name;
  elements.category.value = product.category;
  elements.stock.value = product.stock;
  elements.minimumStock.value = product.minimumStock;
  elements.unit.value = product.unit;
  elements.formTitle.textContent = 'Editar producto';
  elements.submitButton.textContent = 'Guardar cambios';
  elements.cancelEdit.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderMetrics(products) {
  const lowStockCount = products.filter((product) => product.stock < product.minimumStock).length;
  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);

  elements.totalProducts.textContent = String(products.length);
  elements.lowStockCount.textContent = String(lowStockCount);
  elements.totalUnits.textContent = String(totalUnits);
}

function createActionButton(label, onClick, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;

  if (className) {
    button.classList.add(className);
  }

  button.addEventListener('click', onClick);
  return button;
}

function renderProducts(products) {
  elements.tableBody.innerHTML = '';

  if (!products.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6">No hay productos cargados todavia.</td>';
    elements.tableBody.append(row);
    renderMetrics(products);
    return;
  }

  products.forEach((product) => {
    const row = document.createElement('tr');
    const isLowStock = product.stock < product.minimumStock;
    const statusClass = isLowStock ? 'pill pill-low' : 'pill pill-ok';
    const statusLabel = isLowStock ? 'Stock bajo' : 'OK';

    row.innerHTML = `
      <td>
        <strong>${product.name}</strong><br />
        <small>${product.unit}</small>
      </td>
      <td>${product.category}</td>
      <td class="stock-value ${isLowStock ? 'low' : ''}">${product.stock}</td>
      <td>${product.minimumStock}</td>
      <td><span class="${statusClass}">${statusLabel}</span></td>
      <td><div class="actions"></div></td>
    `;

    const actionsContainer = row.querySelector('.actions');
    actionsContainer.append(
      createActionButton('+1', () => adjustStock(product.id, 1)),
      createActionButton('-1', () => adjustStock(product.id, -1)),
      createActionButton('Editar', () => fillForm(product)),
      createActionButton('Eliminar', () => deleteProduct(product.id), 'danger')
    );

    elements.tableBody.append(row);
  });

  renderMetrics(products);
}

async function request(url, options = {}) {
  // Si el backend tiene auth basica activa, el frontend envia el header solo cuando el usuario completo las credenciales.
  let response;

  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers || {})
      },
      ...options
    });
  } catch (_networkError) {
    throw new Error(
      `No se pudo conectar con la API (${url}). Verifica que el backend este encendido y que FRONTEND_ORIGIN permita tu URL actual.`
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'No se pudo procesar la solicitud.' }));
    throw new Error(errorData.message || 'No se pudo procesar la solicitud.');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function loadProducts() {
  try {
    showStatus('Cargando productos...');
    productsState = await request(API_BASE_URL);
    renderProducts(productsState);
    showStatus('Inventario actualizado.', 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function createOrUpdateProduct(event) {
  event.preventDefault();

  const payload = {
    name: elements.name.value,
    category: elements.category.value,
    stock: Number(elements.stock.value),
    minimumStock: Number(elements.minimumStock.value),
    unit: elements.unit.value
  };

  const productId = elements.productId.value;

  try {
    if (productId) {
      await request(`${API_BASE_URL}/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showStatus('Producto actualizado correctamente.', 'success');
    } else {
      await request(API_BASE_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showStatus('Producto agregado correctamente.', 'success');
    }

    resetForm();
    await loadProducts();
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function adjustStock(productId, quantityChange) {
  try {
    // El ajuste rapido evita reenviar el producto completo cuando solo cambia la cantidad disponible.
    await request(`${API_BASE_URL}/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantityChange })
    });

    showStatus(`Stock ${quantityChange > 0 ? 'incrementado' : 'reducido'} correctamente.`, 'success');
    await loadProducts();
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function deleteProduct(productId) {
  const confirmed = window.confirm('¿Seguro que queres eliminar este producto?');

  if (!confirmed) {
    return;
  }

  try {
    await request(`${API_BASE_URL}/${productId}`, { method: 'DELETE' });
    showStatus('Producto eliminado correctamente.', 'success');
    await loadProducts();
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

elements.form.addEventListener('submit', createOrUpdateProduct);
elements.cancelEdit.addEventListener('click', resetForm);
elements.refreshButton.addEventListener('click', loadProducts);

resetForm();
loadProducts();