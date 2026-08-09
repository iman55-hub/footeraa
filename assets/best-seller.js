import { CartAddEvent } from '@theme/events';
class BestSeller extends HTMLElement{
  constructor(){
    super();
    this.sectionId = this.dataset.sectionId;
    this._controller = null; 
    this.addEventListener('click',this.addToCart);
    document.addEventListener('cart:update',this.onCartUpdate.bind(this));
  }
  async addToCart(e){
    let bestSellerBtn = e.target.closest('.best-seller-cart-add');
     if(!bestSellerBtn) return;
     e.preventDefault();
     let parentCard = bestSellerBtn.closest('.my-product-card');
    let errorLine  = parentCard.querySelector('.error');
    try {
     bestSellerBtn.classList.add('disabled');
    bestSellerBtn.setAttribute("disabled","");
    bestSellerBtn.innerText = 'Adding...'
    let isAvailable = bestSellerBtn.dataset.productAvailable;
    let productId = bestSellerBtn.dataset.productId;
     if(!isAvailable || isAvailable.trim()=="false")
      throw new Error;
    if(productId){
        productId = parseInt(productId);
    }
    if(!productId) throw new Error;
    let secToUpdate = document.querySelectorAll('cart-items-component');
    let secIds = [];
    secToUpdate?.forEach((item)=>{
      if(item instanceof HTMLElement &&  item.dataset.sectionId){
        secIds.push(item.dataset.sectionId);
      }
    })
    let response = await fetch(`${window.Shopify.routes.root}cart/add.js`,{
      method:"POST",
        headers: {
        'Content-Type': 'application/json',
         'Accept': 'application/json'
       },
        body: JSON.stringify({'items': [{'id':productId,'quantity':1}],'sections':secIds.join(',')})
    });
    let data = await response.json();
    console.log(data);
    
    if(data.status){
      throw data;
    }
    this.dispatchEvent(
      new CartAddEvent({}, productId, {
              source: 'product-form-component',
              itemCount: 1,
              productId: productId,
              sections: data.sections,
              bestseller:true
            })
    );
     bestSellerBtn.innerText = 'Added'
     setTimeout(() => {
    bestSellerBtn.removeAttribute("disabled");
     bestSellerBtn.classList.remove('disabled');
       bestSellerBtn.innerText = 'Add to Cart';
     }, 2000);
    } catch (error) {
      console.error(error)
      errorLine.classList.remove('hide');
      if(error.status && error.status===422){
        errorLine.innerText = error.description;
        bestSellerBtn.classList.add('disabled');
      bestSellerBtn.setAttribute("disabled","");
         bestSellerBtn.innerText = 'Sold Out'
      }else{
          errorLine.innerText = 'Something went wrong';
           bestSellerBtn.removeAttribute("disabled");
          bestSellerBtn.classList.remove('disabled');
           bestSellerBtn.innerText = 'Add to Cart'
      }
      setTimeout(() => {
        errorLine.classList.add('hide');
         errorLine.innerText="";
      }, 2000);
    }
  }
  async onCartUpdate(e){
    if(e.detail.data.bestseller){
       console.log('returning') ;
       return;
    }
    if(!this.sectionId) return;
    if (this._controller) {
      this._controller.abort();
      console.log('⛔ Previous request cancelled');
    }
     this._controller = new AbortController();
     let signal = this._controller.signal;
     let currentController = this._controller;    
    try {
      let res = await fetch(`${window.location.pathname}?section_id=${this.sectionId}`,{signal});
      if(!res.ok)
        throw new Error('something went wrong');
      let data = await res.text();
      let dom = new DOMParser();
      let html = dom.parseFromString(data,'text/html');
      let newHTML = html.querySelector(this.tagName.toLowerCase());
      if(newHTML){
        this.innerHTML = newHTML.innerHTML;
      }
    } catch (error) {
      console.error(error);
    }
    finally{
      if(currentController==this._controller){
            this._controller = null;
      }
    }
  }
}
customElements.define('best-seller',BestSeller)