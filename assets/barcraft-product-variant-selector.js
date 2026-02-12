if (!customElements.get("barcraft-product-variant-selector")) {
  class BarcraftProductVariantSelector extends HTMLElement {
    constructor() {
      super();
      this.product = null;
    }

    connectedCallback() {
      this.loadProduct();
      this.handleVariantClick = this.handleVariantClick.bind(this);
      this.addEventListener("click", this.handleVariantClick);
    }

    loadProduct() {
      const productData = this.dataset.product;
      if (productData) {
        this.product = JSON.parse(productData);
      }
    }

    handleVariantClick(event) {
      if (!this.product) return;

      const variantColorElement = event.target.closest(".variant-color");
      if (!variantColorElement) return;

      const selectedValue = variantColorElement.dataset.value;
      const optionName = "Color";

      const optionIndex = this.product.options.indexOf(optionName);
      if (optionIndex === -1) return;

      const selectedVariant = this.product.variants.find(
        (variant) => variant.options[optionIndex] === selectedValue,
      );
      if (!selectedVariant) return;

      console.log("Selected variant:", selectedVariant);

      this.updateActiveState(variantColorElement);
      this.updateQuickAddPopper(event, selectedVariant);
      if (selectedVariant) {
        let priceElement = event.target
          .closest(".card.card--standard.card--media")
          .querySelector(".price-item.price-item--regular");
        console.log("Price element:", priceElement);
        if (priceElement) {
          priceElement.textContent = this.formatMoney(selectedVariant.price);
        }
      }
    }

    formatMoney(amount) {
      const currency = Shopify.currency.active;
      const formatted = (amount / 100).toFixed(2);
      const withCommas = parseFloat(formatted).toLocaleString();

      return `${currency === "PKR" ? "Rs." : "$"}${withCommas}${withCommas.includes(".") ? "" : ".00"} ${currency}`;
    }

    updateActiveState(activeEl) {
      this.querySelectorAll(".variant-color").forEach((el) =>
        el.classList.remove("variant-color--active"),
      );
      activeEl.classList.add("variant-color--active");
    }

    updateQuickAddPopper(event, selectedVariant) {
      const card = event.target.closest(".card.card--standard.card--media");
      if (!card) return;

      const quickAddPopper = card.querySelector(".quick_add_popper");
      if (!quickAddPopper) return;

      console.log("Updating quick add popper with variant:", selectedVariant);
      quickAddPopper.dataset.variant = JSON.stringify(selectedVariant);
      quickAddPopper.dataset.variantId = selectedVariant.id;
    }
  }

  customElements.define(
    "barcraft-product-variant-selector",
    BarcraftProductVariantSelector,
  );
}

if (!customElements.get("barcraft-modal-popup")) {
  class ModalPopUp extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });

      this.shadowRoot.innerHTML = `
        <style>
          .modal { display: none; position: fixed; inset: 0; z-index: 9999; }
          .modal.active { display: block; overflow: auto; }
          .overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); }
          .content { position: relative; background: #fff; width: 90%; max-width: 80rem; min-width: 30rem; margin: 10vh auto; padding: 20px; z-index: 2; }
          .close { position: absolute; top: 10px; right: 10px; cursor: pointer; background: unset; font-size: x-large; border: unset; }
          #qv-content { margin: 2rem; display: flex; flex-wrap: wrap; gap: 16px; }
          #qv-image { width: 100%; max-width: 200px; min-width: 200px; height: auto; }
          #qv-title { margin: 0; font-size: clamp(2rem, 4vw, 2.5rem); font-weight: 600; }
          #qv-color { font-size: clamp(1rem, 4vw, 1.5rem); font-weight: 600;margin: 0; }
          #qv-quantity-selector { width: fit-content;padding: 1rem;border: 1px solid #000; display: flex; align-items: center; }
          #qv-quantity-selector button { background: unset; border: unset; padding: 5px 12px; }
          #qv-quantity-selector input { width: 4rem !important;padding-left: 13px; text-align: center; border: none; }
          button { cursor: pointer; }
        </style>

        <div class="modal">
          <div class="overlay"></div>
          <div class="content">
            <button class="close">×</button>
            <div id="qv-content">
              <img id="qv-image" src="" />
              <div>
                <h2 id="qv-title"></h2>
                <h3 id="qv-color"></h3>
                <p id="qv-price"></p>

                <div id="qv-quantity-selector">
                  <button type="button" id="decrease-qty-btn">−</button>
                  <input type="number" id="item-quantity" value="1" min="1" max="12" readonly />
                  <button type="button" id="increase-qty-btn">+</button>
                </div>
                <form  action="/cart/add" method="post">
                <input type="hidden" id="selected-product-id" name="id" />
                <input type="hidden" id="selected-product-quantity" name="quantity" value="1" />
                <button type="submit" id="add-to-cart-btn" style="margin-top:20px;padding:12px 40px;background:#000;color:#fff;border:none;border-radius:4px;">Add to Cart</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      `;

      this.modal = this.shadowRoot.querySelector(".modal");
      this.closeBtn = this.shadowRoot.querySelector(".close");
      this.overlay = this.shadowRoot.querySelector(".overlay");
      this.MIN_QTY = 1;
      this.MAX_QTY = 12;
    }

    connectedCallback() {
      this.closeBtn.addEventListener("click", () => this.hide());
      this.overlay.addEventListener("click", () => this.hide());

      this.increaseBtn = this.shadowRoot.getElementById("increase-qty-btn");
      this.decreaseBtn = this.shadowRoot.getElementById("decrease-qty-btn");
      this.qtyInput = this.shadowRoot.getElementById("item-quantity");
      this.hiddenQtyInput = this.shadowRoot.getElementById(
        "selected-product-quantity",
      );
      this.addToCartBtn = this.shadowRoot.getElementById("add-to-cart-btn");

      this.increaseBtn.addEventListener("click", () => {
        const qty = this.getQty();
        if (qty < this.MAX_QTY) {
          this.updateQty(qty + 1);
        }
      });

      this.decreaseBtn.addEventListener("click", () => {
        const qty = this.getQty();
        if (qty > this.MIN_QTY) {
          this.updateQty(qty - 1);
        }
      });

      this.updateButtons();
      this.form = this.shadowRoot.querySelector("form");

      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.addToCart();
      });
    }

    getQty() {
      return parseInt(this.qtyInput.value) || this.MIN_QTY;
    }

    updateQty(newQty) {
      this.qtyInput.value = newQty;
      this.hiddenQtyInput.value = newQty;
      this.updateButtons();
    }

    updateButtons() {
      const qty = this.getQty();
      const available = this.variant ? this.variant.available : true;

      this.decreaseBtn.disabled = !available || qty <= this.MIN_QTY;
      this.increaseBtn.disabled = !available || qty >= this.MAX_QTY;
      this.addToCartBtn.disabled = !available;

      this.decreaseBtn.style.cursor = this.decreaseBtn.disabled
        ? "not-allowed"
        : "pointer";
      this.increaseBtn.style.cursor = this.increaseBtn.disabled
        ? "not-allowed"
        : "pointer";
      this.addToCartBtn.style.cursor = this.addToCartBtn.disabled
        ? "not-allowed"
        : "pointer";
    }

    show(product, variant) {
      this.variant = variant;
      this.updateQty(1);
      this.shadowRoot.getElementById("qv-title").textContent = product.title;
      this.shadowRoot.getElementById("qv-color").textContent =
        variant && variant.option1 !== "Default Title" ? variant.option1 : "";
      const price = variant ? variant.price : product.price;
      this.shadowRoot.getElementById("qv-price").textContent =
        this.formatMoney(price);
      this.shadowRoot.getElementById("qv-image").src =
        variant?.featured_image?.src ||
        product?.images?.[0] ||
        "https://via.placeholder.com/400x400?text=No+Image";
      this.shadowRoot.getElementById("selected-product-id").value =
        variant?.id || product?.id || "";
      this.modal.classList.add("active");
      document.body.style.overflow = "hidden";
      this.updateButtons();
    }

    hide() {
      this.updateQty(1);
      this.modal.classList.remove("active");
      document.body.style.overflow = "auto";
    }

    formatMoney(amount) {
      const currency = Shopify?.currency?.active || "USD";
      const formatted = (amount / 100).toFixed(2);
      const withCommas = Number(formatted).toLocaleString();
      return `${currency === "PKR" ? "Rs." : "$"}${withCommas} ${currency}`;
    }

    addToCart(redirectToCheckout = false) {
      const formData = new FormData(this.form);

      this.addToCartBtn.disabled = true;

      fetch("/cart/add.js", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) throw new Error("Network response was not ok");
          return response.json();
        })
        .then((cartItem) => {
          console.log("Item added:", cartItem);

          if (redirectToCheckout) {
            window.location.href = "/checkout";
            return;
          }

          this.openCartDrawer(cartItem);
          this.hide();
        })
        .catch((error) => {
          console.error("Add to cart error:", error);
        })
        .finally(() => {
          this.addToCartBtn.disabled = false;
        });
    }

    openCartDrawer(cartItem) {
      const cartDrawer = document.querySelector("cart-drawer");
      if (!cartDrawer) return;

      fetch(
        `${window.Shopify.routes.root}?sections=cart-drawer,cart-icon-bubble`,
      )
        .then((response) => response.json())
        .then((sections) => {
          cartDrawer.renderContents({ id: cartItem.id, sections });
        });
    }
  }

  customElements.define("barcraft-modal-popup", ModalPopUp);
}
