// AURA & FORMA - Frontend Client Interactions

document.addEventListener('DOMContentLoaded', () => {
  // 1. Auto dismiss alerts after 5 seconds
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-10px)';
      alert.style.transition = 'all 0.4s ease';
      setTimeout(() => alert.remove(), 400);
    }, 6000);
  });

  // 2. Alert close buttons
  document.querySelectorAll('.alert-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const alert = e.target.closest('.alert');
      if (alert) alert.remove();
    });
  });

  // 3. Search clear & auto-submit helper
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const form = searchBox.closest('form');
        if (form) form.submit();
      }
    });
  }

  // 4. Cart quantity buttons
  document.querySelectorAll('.qty-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      const row = this.closest('.cart-item-row');
      if (!row) return;
      const input = row.querySelector('.qty-input');
      if (!input) return;

      const currentVal = parseInt(input.value, 10) || 1;
      const action = this.dataset.action;
      let newVal = currentVal;

      if (action === 'increase') {
        newVal = currentVal + 1;
      } else if (action === 'decrease') {
        newVal = Math.max(1, currentVal - 1);
      }

      input.value = newVal;
    });
  });

  // 5. Admin Edit Product Modal / Inline Filler
  const editButtons = document.querySelectorAll('.btn-admin-edit');
  editButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const desc = btn.getAttribute('data-desc');
      const cat = btn.getAttribute('data-category');
      const price = btn.getAttribute('data-price');
      const stock = btn.getAttribute('data-stock');
      const img = btn.getAttribute('data-img');

      const editForm = document.getElementById('editProductForm');
      if (editForm) {
        editForm.action = `/admin/products/edit/${id}`;
        const nameInput = document.getElementById('editProdName');
        const descInput = document.getElementById('editProdDesc');
        const catInput = document.getElementById('editProdCat');
        const priceInput = document.getElementById('editProdPrice');
        const stockInput = document.getElementById('editProdStock');
        const imgInput = document.getElementById('editProdImg');

        if (nameInput) nameInput.value = name;
        if (descInput) descInput.value = desc;
        if (catInput) catInput.value = cat;
        if (priceInput) priceInput.value = price;
        if (stockInput) stockInput.value = stock;
        if (imgInput) imgInput.value = img;

        editForm.scrollIntoView({ behavior: 'smooth' });
        const modal = document.getElementById('editModal');
        if (modal) modal.style.display = 'block';
      }
    });
  });
});
