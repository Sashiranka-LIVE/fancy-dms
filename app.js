/* DMS Fancy Shop — edit PRODUCTS and SHOP below to maintain the store. */
'use strict';
const SHOP = { whatsapp: '94714150911', cartKey: 'dms-bag-v1' };
const PRODUCTS = [
{"id":"medicube-vita-c","brand":"Medicube","name":"Deep Vita C Capsule Cream","category":"Skincare","price":6600,"image":"assets/medicube-vita-c.webp","description":"Vitamin C capsule cream","details":"Medicube Deep Vita C Capsule Cream. Advertised on our Facebook page. Please confirm current price, pack size and availability before ordering.","source":"https://www.facebook.com/photo.php?fbid=1408666397922507","artwork":true},
{"id":"boj-relief-sun","brand":"Beauty of Joseon","name":"Relief Sun","category":"Skincare","price":5900,"image":"assets/boj-relief-sun.webp","description":"Rice + Probiotics · SPF50+ PA++++","details":"Beauty of Joseon Relief Sun. Advertised on our Facebook page. Please confirm current price, pack size and availability before ordering.","source":"https://www.facebook.com/photo.php?fbid=1408648641257616","artwork":true},
{"id":"cosrx-snail","brand":"COSRX","name":"Advanced Snail 92 All in One Cream","category":"Skincare","price":5600,"image":"assets/cosrx-snail.webp","description":"Face cream · 100 g packaging shown","details":"COSRX Advanced Snail 92 All in One Cream. Advertised on our Facebook page. Please confirm current price, pack size and availability before ordering.","source":"https://www.facebook.com/photo.php?fbid=1219756350146847","artwork":true},
{"id":"medicube-mask","brand":"Medicube","name":"Collagen Night Wrapping Mask","category":"Skincare","price":7000,"image":"assets/medicube-mask.webp","description":"Overnight facial mask","details":"Medicube Collagen Night Wrapping Mask. Advertised on our Facebook page. Please confirm current price, pack size and availability before ordering.","source":"https://www.facebook.com/photo.php?fbid=1219813800141102","artwork":true},
{"id":"axis-y-serum","brand":"AXIS-Y","name":"Dark Spot Correcting Glow Serum","category":"Skincare","price":5500,"image":"assets/axis-y-serum.webp","description":"Niacinamide 5% · 50 ml packaging shown","details":"AXIS-Y Dark Spot Correcting Glow Serum. Advertised on our Facebook page. Please confirm current price, pack size and availability before ordering.","source":"https://www.facebook.com/photo.php?fbid=1219754600147022","artwork":true},
{"id":"medicube-peptide","brand":"Medicube","name":"PDRN Pink Peptide Serum","category":"Skincare","price":7000,"image":"assets/medicube-peptide.webp","description":"Facial serum · 30 ml packaging shown","details":"Medicube PDRN Pink Peptide Serum. Advertised on our Facebook page. Please confirm current price, pack size and availability before ordering.","source":"https://www.facebook.com/photo.php?fbid=1219753886813760","artwork":true},
{"id":"olifair-cream","brand":"Olifair","name":"Radiant Effect Cream","category":"Skincare","price":6000,"image":"assets/olifair-cream.webp","description":"Pearls + saffron · face cream","details":"Olifair Radiant Effect Cream. Advertised on our Facebook page. Please confirm current price, pack size and availability before ordering.","source":"https://www.facebook.com/photo.php?fbid=1219753006813848","artwork":true},
{id:'cerave',brand:'CeraVe',name:'Mineral Sunscreen',category:'Skincare',price:8000,image:'assets/cerave.png',shot:'0% 0%',description:'Hydrating Mineral Sunscreen · SPF 50',details:'CeraVe Hydrating Mineral Sunscreen. Ask our team about the current pack size, availability and product details.'},
{id:'elvive',brand:'L’Oréal Elvive',name:'Elvive Shampoo',category:'Haircare',price:3500,image:'assets/elvive.png',shot:'50% 0%',description:'Full Resist / Color Vive · 400 ml',details:'Choose Full Resist or Color Vive in your order notes. The pictured bottles show the available variants; price and quantity per variant will be confirmed by our team.'},
{id:'deepshine',brand:'deepShine',name:'Keratin Haircare',category:'Haircare',price:2400,image:'assets/deepshine.png',shot:'100% 0%',description:'Shampoo / conditioner · 1000 ml',details:'Keratin Care shampoo and conditioner. Please specify your preferred item in the order notes. Price per item or set will be confirmed before payment.'},
{id:'soap',brand:'Kojie San',name:'Classic Beauty Soap',category:'Body care',price:1600,image:'assets/soap.png',shot:'0% 100%',description:'Classic beauty soap · daily body care',details:'Classic beauty soap from our collection. Confirm the current pack size and product information with our team before ordering.'},
{id:'glupa',brand:'Glupa',name:'Glutathione + Papaya Soap',category:'Body care',price:2600,image:'assets/glupa.png',shot:'50% 100%',description:'Glutathione + papaya · 135 g',details:'Glupa soap, 135 g packaging shown. Contact our team for current availability and ingredient information.'},
{id:'collagen',brand:'Manee',name:'Gluta Collagen Pink',category:'Beauty supplements',price:4200,image:'assets/collagen-clean.webp',description:'Gluta Collagen Pink · beauty supplement',details:'Gluta Collagen Pink dietary supplement. Request the full ingredient label and directions before purchasing. Ask a qualified healthcare professional whether it is suitable for you.'}
];
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const money = n => 'LKR ' + n.toLocaleString('en-LK');
const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sanitizeCart(value) {
 const result = {};
 if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
 for (const p of PRODUCTS) if (Number.isInteger(value[p.id]) && value[p.id]>0) result[p.id]=Math.min(99,value[p.id]);
 return result;
}
function buildInquiry(cart, fields) {
 const lines = PRODUCTS.filter(p=>cart[p.id]).map(p=>'- '+p.brand+' '+p.name+' × '+cart[p.id]+' — '+money(p.price*cart[p.id]));
 const total = PRODUCTS.reduce((s,p)=>s+p.price*(cart[p.id]||0),0);
 return ['Hi DMS Fancy Shop! I would like to inquire about this order:','',...lines,'','Estimated subtotal: '+money(total),'Delivery charges, final prices and stock: please confirm.','','Name: '+fields.name.trim(),'Phone: '+fields.phone.trim(),'Preferred method: '+fields.method,fields.method==='Store pickup'?'Collection: Store pickup, Negombo':'Delivery address: '+fields.address.trim(),fields.notes.trim()?'Notes: '+fields.notes.trim():'','','Please confirm availability and the next steps.'].filter(x=>x!==null).join('\n');
}
let bag = {}; try { bag=sanitizeCart(JSON.parse(localStorage.getItem(SHOP.cartKey)||'{}')); } catch {}
let category='All', toastTimer;
const bagSvg='<svg><use href="#bag-icon"/></svg>';
function saveBag(){try{localStorage.setItem(SHOP.cartKey,JSON.stringify(bag));}catch{} updateCounts();}
function updateCounts(){const count=Object.values(bag).reduce((a,b)=>a+b,0);$$('.bag-count').forEach(e=>e.textContent=count);}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2500);}
function add(id){if(!PRODUCTS.some(p=>p.id===id))return;if((bag[id]||0)>=99){toast('Maximum quantity is 99 per item.');return;}bag[id]=(bag[id]||0)+1;saveBag();toast('Added to your beauty bag');if($('#bag-dialog').open)renderBag();}
function shot(p,cls=''){return p.shot?'<span class="packshot '+cls+'" role="img" aria-label="'+escapeHTML(p.brand+' '+p.name)+'" style="background-position:'+p.shot+'"></span>':'<img class="'+cls+'" loading="lazy" src="'+p.image+'" alt="'+escapeHTML(p.brand+' '+p.name)+'">';}
function renderProducts(){
 const query=$('#search').value.trim().toLowerCase();
 let list=PRODUCTS.filter(p=>(category==='All'||p.category===category)&&[p.name,p.brand,p.category,p.description].join(' ').toLowerCase().includes(query));
 const sort=$('#sort').value;
 if(sort==='low')list.sort((a,b)=>a.price-b.price);if(sort==='high')list.sort((a,b)=>b.price-a.price);if(sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name));
 $('#result-count').textContent=list.length+' beauty essential'+(list.length===1?'':'s');
 $('#product-grid').innerHTML=list.length?list.map((p,i)=>'<article class="product-card" style="animation-delay:'+i*35+'ms"><button class="product-image" data-detail="'+p.id+'" aria-label="View '+escapeHTML(p.brand+' '+p.name)+'">'+shot(p)+'<span class="category-tag">'+p.category+'</span></button><div class="product-info"><p class="product-brand">'+escapeHTML(p.brand.toUpperCase())+'</p><h3><button data-detail="'+p.id+'">'+escapeHTML(p.name)+'</button></h3><p class="product-description">'+escapeHTML(p.description)+'</p><div class="product-bottom"><span class="price">'+money(p.price)+'</span><button class="add-button" data-add="'+p.id+'" aria-label="Add '+escapeHTML(p.brand+' '+p.name)+' to bag">'+bagSvg+' Add to bag</button></div></div></article>').join(''):'<div class="empty-results"><h3>No matching essentials</h3><p>Try another name or explore the full collection.</p><button class="button green" id="reset-filters">Show all products</button></div>';
}
function filter(next){category=next;$$('[data-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.filter===category);b.setAttribute('aria-pressed',String(b.dataset.filter===category));});renderProducts();}
function renderBag(){
 const items=PRODUCTS.filter(p=>bag[p.id]);
 $('#checkout').hidden=!items.length;
 $('#bag-items').innerHTML=items.length?items.map(p=>'<article class="bag-row">'+shot(p,'bag-shot')+'<div><h3>'+escapeHTML(p.brand+' '+p.name)+'</h3><p>'+money(p.price)+' each</p><div class="quantity"><button data-qty="'+p.id+'" data-delta="-1" aria-label="Decrease '+escapeHTML(p.name)+' quantity">−</button><span>'+bag[p.id]+'</span><button data-qty="'+p.id+'" data-delta="1" aria-label="Increase '+escapeHTML(p.name)+' quantity" '+(bag[p.id]>=99?'disabled':'')+'>+</button></div></div><div><p>'+money(p.price*bag[p.id])+'</p><button class="remove" data-remove="'+p.id+'">Remove</button></div></article>').join(''):'<div class="empty-bag"><span>♧</span><h3>A little beauty awaits.</h3><p>Your bag is empty. Discover your next favourite.</p><button class="button green" id="continue-shopping">Explore collection ↗</button></div>';
 $('#subtotal').textContent=money(items.reduce((sum,p)=>sum+p.price*bag[p.id],0));
}
function openBag(){renderBag();$('#bag-dialog').showModal();}
function showDetail(id){const p=PRODUCTS.find(p=>p.id===id);if(!p)return;$('#product-detail').innerHTML='<div class="detail-image">'+shot(p)+'</div><div class="detail-copy"><p class="eyebrow">'+escapeHTML(p.brand)+'</p><h2>'+escapeHTML(p.name)+'</h2><p>'+escapeHTML(p.details)+'</p><strong class="price">'+money(p.price)+'</strong><p class="fine-print">Estimated price. Confirm the exact variant, pack size and stock with our team.</p>'+(p.artwork?'<p class="fine-print">Original promotional artwork. Offers and contact details in the image may be outdated. Use this website to inquire at 071 415 0911.</p><a class="text-link" href="'+p.source+'" target="_blank" rel="noopener">View Facebook product post ↗</a><br><br>':'')+'<button class="button green" data-add="'+p.id+'">Add to bag '+bagSvg+'</button><button class="detail-inquire text-link" data-inquire="'+p.id+'">Ask about this product ↗</button></div>';$('#product-dialog').showModal();}
document.addEventListener('click',e=>{
 const addButton=e.target.closest('[data-add]');if(addButton)add(addButton.dataset.add);
 const detail=e.target.closest('[data-detail]');if(detail)showDetail(detail.dataset.detail);
 const filterButton=e.target.closest('[data-filter]');if(filterButton)filter(filterButton.dataset.filter);
 const nav=e.target.closest('[data-category]');if(nav){$('#search').value='';filter(nav.dataset.category);}
 const qty=e.target.closest('[data-qty]');if(qty){const id=qty.dataset.qty;bag[id]=Math.max(0,Math.min(99,(bag[id]||0)+Number(qty.dataset.delta)));if(!bag[id])delete bag[id];saveBag();renderBag();}
 const remove=e.target.closest('[data-remove]');if(remove){delete bag[remove.dataset.remove];saveBag();renderBag();}
 if(e.target.closest('.bag-trigger'))openBag();
 if(e.target.closest('.close'))e.target.closest('dialog').close();
 if(e.target.closest('#continue-shopping')){$('#bag-dialog').close();location.hash='collection';}
 if(e.target.closest('#reset-filters')){$('#search').value='';filter('All');}
 const inquiry=e.target.closest('[data-inquire]');if(inquiry){const p=PRODUCTS.find(p=>p.id===inquiry.dataset.inquire);window.open('https://wa.me/'+SHOP.whatsapp+'?text='+encodeURIComponent('Hi DMS Fancy Shop, I would like to ask about '+p.brand+' '+p.name+'. Please confirm price, variants and availability.'),'_blank','noopener');}
 if(e.target.closest('.mobile-menu a')){$('.mobile-menu').hidden=true;$('.menu-toggle').setAttribute('aria-expanded','false');}
});
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('#search').addEventListener('input',renderProducts);$('#sort').addEventListener('change',renderProducts);
$('#search-toggle').addEventListener('click',()=>{location.hash='collection';$('#search').focus({preventScroll:true});});
$('.menu-toggle').addEventListener('click',()=>{const menu=$('.mobile-menu');menu.hidden=!menu.hidden;$('.menu-toggle').setAttribute('aria-expanded',String(!menu.hidden));});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('.mobile-menu').hidden=true;$('.menu-toggle').setAttribute('aria-expanded','false');}});
$('#policy-open').addEventListener('click',()=>$('#policy-dialog').showModal());
$('#method').addEventListener('change',()=>{const pickup=$('#method').value==='Store pickup';$('#address-label').hidden=pickup;$('#checkout-form').elements.address.required=!pickup;$('#checkout-form').elements.address.setCustomValidity('');});
$('#checkout-form').addEventListener('submit',e=>{
 e.preventDefault();if(!Object.keys(bag).length)return;
 const form=e.currentTarget;const fields=Object.fromEntries(new FormData(form));
 form.elements.name.setCustomValidity(fields.name.trim()?'':'Please enter your name.');
 form.elements.phone.setCustomValidity(/^[+\d ()-]{9,20}$/.test(fields.phone.trim())?'':'Enter a valid contact number.');
 form.elements.address.setCustomValidity(fields.method==='Store pickup'||fields.address.trim()?'':'Please enter your delivery address.');
 if(!form.reportValidity())return;
 const message=buildInquiry(bag,fields);
 const link=document.createElement('a');link.href='https://wa.me/'+SHOP.whatsapp+'?text='+encodeURIComponent(message);link.target='_blank';link.rel='noopener';link.click();
});
$('#checkout-form').addEventListener('input',e=>{if(e.target.setCustomValidity)e.target.setCustomValidity('');});
$('#year').textContent=new Date().getFullYear();
if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('pending');io.unobserve(entry.target);}}),{threshold:.08});$$('.reveal').forEach(el=>{el.classList.add('pending');io.observe(el);});}
updateCounts();renderProducts();




