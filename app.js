/**
 * contentful SDK
 */
const client = contentful.createClient({
  space: 'u8trboa3mmg8',
  accessToken: 'BJs19CsYfC1COOoV5PPxiiIriXovQRWbJRYFzKHAnhY'
});

/**
 * variables
 */
const cartBtn = document.querySelector('.cart-btn'),
  cartItemNumber = document.querySelector('.cart-items'),
  productsDOM = document.querySelector('.products-center'),
  cartOverlay = document.querySelector('.cart-overlay'),
  cartContent = document.querySelector('.cart-content'),
  cartTotal = document.querySelector('.cart-total'),
  closeCartBtn = document.querySelector('.close-cart'),
  bannerBtn = document.querySelector('.clear-cart'),
  cartDOM = document.querySelector('.cart');

/**
 * cart
 * buttons - for handeling products
 */
let cart = [];
let bagBtns = [];

/**
 * fetch-products
 */
class Products {
  async getProducts() {
    try {
      let contentful = await client.getEntries({
        content_type: 'comfyHouseProducts'
      });

      /**
       * if i use local-json
        const response = await fetch('products.json');
        const data = await response.json();
       */

      let products = contentful.items;
      products = products.map(item => {
        const { id } = item.sys;
        const { title, price } = item.fields;
        const image = item.fields.image.fields.file.url;

        return { title, price, id, image };
      });

      return products;
    } catch {
      console.error(error);
    }
  }
}

/**
 * UI-Handler
 */
class UI {
  displayProducts(products) {
    let result = '';
    products.forEach(product => {
      result += `
            <article class="product">
                <div class="img-container">
                <img
                    src=${product.image}
                    alt="product-img"
                    class="product-img"
                />

                <button class="bag-btn" data-id=${product.id}>
                    <i class="fas fa-shopping-cart"></i>
                    add to bag
                </button>
                </div>
                <h3>${product.title}</h3>
                <h4>${product.price}</h4>
            </article>
        `;
    });

    productsDOM.innerHTML = result;
  }

  handleProductsButton() {
    const productBtns = [...document.querySelectorAll('.bag-btn')];
    bagBtns = productBtns;

    productBtns.forEach(btn => {
      const btnId = btn.dataset.id;
      const inCart = cart.find(product => product.id === btnId);

      if (inCart) {
        btn.innerText = 'In Cart';
        btn.disabled = true;
      }

      btn.addEventListener('click', e => {
        btn.innerText = 'In Cart';
        btn.disabled = true;

        /**
         * *get the product from the products
         * *add product to the cart
         * *save cart in local storage
         * *set cartItems number
         * *display cart item
         * *show the cart
         */
        let cartItem = { ...LocalStorage.getCartItem(btnId), amount: 1 };
        cart = [...cart, cartItem];
        LocalStorage.saveCart(cart);
        this.setCartValues(cart);
        this.displayCartItems(cartItem);
        this.displayCartHandler();
      });
    });
  }

  setCartValues(cart) {
    let totalItems = 0;
    let priceTotal = 0;

    cart.map(item => {
      totalItems += item.amount;
      priceTotal += item.price * item.amount;
    });

    cartItemNumber.innerText = totalItems;
    cartTotal.innerText = parseFloat(priceTotal.toFixed(2));
  }

  displayCartItems(item) {
    const itemWrapper = document.createElement('div');
    itemWrapper.classList.add('cart-item');

    itemWrapper.innerHTML = `
        <img src=${item.image} alt="product" />

        <div>
            <h4>${item.title}</h4>
            <h5>$${item.price}</h5>
            <span class="remove-item" data-id=${item.id}>remove</span>
        </div>
        <div>
            <i class="fas fa-chevron-up" data-id=${item.id}></i>
            <p class="item-amount">${item.amount}</p>
            <i class="fas fa-chevron-down" data-id=${item.id}></i>
        </div>
    `;

    cartContent.appendChild(itemWrapper);
  }

  displayCartHandler() {
    if (cartOverlay.classList.contains('transparentBcg')) {
      cartOverlay.classList.remove('transparentBcg');
      cartDOM.classList.remove('showCart');
      console.log('hello');
    } else {
      cartOverlay.classList.add('transparentBcg');
      cartDOM.classList.add('showCart');
    }
  }

  setUpApp() {
    cart = LocalStorage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);

    cartBtn.addEventListener('click', this.displayCartHandler);
    closeCartBtn.addEventListener('click', this.displayCartHandler);
  }

  populateCart(cart) {
    cart.forEach(item => this.displayCartItems(item));
  }

  cartLogic() {
    // clear-button functionality
    bannerBtn.addEventListener('click', () => {
      this.clearCart();
    });

    // cart-item functionality - event bubling
    cartContent.addEventListener('click', e => {
      if (e.target.classList.contains('remove-item')) {
        const removeButton = e.target;
        const itemId = removeButton.dataset.id;
        cartContent.removeChild(removeButton.parentElement.parentElement);
        this.removeCartItem(itemId);
      } else if (e.target.classList.contains('fa-chevron-up')) {
        const increaseButton = e.target;
        const itemId = increaseButton.dataset.id;
        let itemToIncrease = cart.find(item => item.id === itemId);
        itemToIncrease.amount = itemToIncrease.amount + 1;
        LocalStorage.saveCart(cart);
        this.setCartValues(cart);
        increaseButton.nextElementSibling.innerText = itemToIncrease.amount;
      } else if (e.target.classList.contains('fa-chevron-down')) {
        const decreaseButton = e.target;
        const itemId = decreaseButton.dataset.id;
        let itemToDecrease = cart.find(item => item.id === itemId);
        itemToDecrease.amount = itemToDecrease.amount - 1;

        if (itemToDecrease.amount > 0) {
          LocalStorage.saveCart(cart);
          this.setCartValues(cart);
          decreaseButton.previousElementSibling.innerText =
            itemToDecrease.amount;
        } else {
          cartContent.removeChild(decreaseButton.parentElement.parentElement);
          this.removeCartItem(itemId);
        }
      }
    });
  }

  clearCart() {
    const cartItemsId = cart.map(item => item.id);
    cartItemsId.forEach(id => this.removeCartItem(id));
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.displayCartHandler();
  }

  removeCartItem(id) {
    cart = cart.filter(item => item.id !== id);
    this.setCartValues(cart);
    LocalStorage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>
    add to bag`;
  }

  getSingleButton(id) {
    return bagBtns.find(btn => btn.dataset.id === id);
  }
}

/**
 * storage-handler
 */
class LocalStorage {
  static saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
  }

  static getCartItem(id) {
    const products = JSON.parse(localStorage.getItem('products'));
    return products.find(product => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem('cart')
      ? JSON.parse(localStorage.getItem('cart'))
      : [];
  }
}

/**
 * controller
 */
document.addEventListener('DOMContentLoaded', () => {
  const fetchProducts = new Products();
  const ui = new UI();

  ui.setUpApp();

  fetchProducts
    .getProducts()
    .then(products => {
      ui.displayProducts(products);
      LocalStorage.saveProducts(products);
    })
    .then(() => {
      ui.handleProductsButton();
      ui.cartLogic();
    });
});
