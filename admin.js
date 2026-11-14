/* Owner-only product manager. Authorization is enforced by database and storage policies. */
(function(){
'use strict';
const api=window.DMSCatalog,$=s=>document.querySelector(s),form=$('#product-form');
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n===null?'Ask for price':'LKR '+Number(n).toLocaleString('en-LK');
let products=[],current=null,file=null,previewURL='',uploadedURL='',busy=false,dirty=false,selection=0,draftId='';
function status(message,error=false,editor=false){const el=$(editor?'#editor-status':'#status');el.textContent=message;el.classList.toggle('error',error);}
function image(p){return p.shot?'<span class="packshot" role="img" aria-label="'+escapeHTML(p.name)+'" style="background-position:'+escapeHTML(p.shot)+'"></span>':p.image?'<img class="'+(p.cutout?'clean-cutout':'')+'" src="'+escapeHTML(p.image)+'" alt="'+escapeHTML(p.name)+'">':'';}
function render(){
 const q=$('#admin-search').value.trim().toLowerCase(),v=$('#visibility').value;
 const list=products.filter(p=>(v==='all'||p.visible===(v==='live'))&&(p.brand+' '+p.name).toLowerCase().includes(q));
 $('#product-count').textContent='('+products.length+')';
 $('#admin-list').innerHTML=list.length?list.map(p=>'<article class="admin-item"><div class="admin-item-image">'+image(p)+'</div><div class="admin-item-copy"><span class="visibility-tag '+(!p.visible?'hidden-tag':'')+'">'+(p.visible?'Visible in store':'Hidden / draft')+'</span><p class="product-brand">'+escapeHTML(p.brand)+'</p><h3>'+escapeHTML(p.name)+'</h3><p>'+escapeHTML(p.description)+'</p><strong>'+money(p.price)+'</strong><div class="admin-item-actions"><button class="button outline" data-edit="'+p.id+'">Edit listing</button><button class="button delete-listing" data-delete="'+p.id+'" aria-label="Delete '+escapeHTML(p.brand+' '+p.name)+'">Delete</button></div></div></article>').join(''):'<p>No listings match this view. Add a product or change your filters.</p>';
}
async function reload(){products=await api.list(true);render();}
function setBusy(value){busy=value;$('#product-form').inert=value;$('#close-editor').disabled=value;$('#editor').setAttribute('aria-busy',String(value));}
function clearImage(){selection++;if(previewURL)URL.revokeObjectURL(previewURL);previewURL='';uploadedURL='';file=null;$('#image-file').value='';$('#image-confirm').checked=false;$('#image-confirm').required=false;}
function data(){const f=form.elements;return {...(current||{}),id:current?.id||'preview',brand:f.brand.value.trim(),name:f.name.value.trim(),description:f.description.value.trim(),details:f.details.value.trim(),category:f.category.value,price:f.price_mode.value==='ask'?null:Number(f.price.value),visible:f.visible.value==='true',sort_order:Number(f.sort_order.value),image:uploadedURL||current?.image||'',shot:file?null:current?.shot||null,cutout:file?true:Boolean(current?.cutout),version:current?.version||1};}
function preview(){const p=data();p.image=previewURL||p.image;$('#price-label').hidden=p.price===null;form.elements.price.required=p.price!==null;
 $('#card-preview').innerHTML='<article class="product-card"><div class="product-image">'+image(p)+'<span class="category-tag">'+escapeHTML(p.category)+'</span></div><div class="product-info"><p class="product-brand">'+escapeHTML(p.brand||'YOUR BRAND')+'</p><h3>'+escapeHTML(p.name||'Product name')+'</h3><p class="product-description">'+escapeHTML(p.description||'Your short description')+'</p><div class="product-bottom"><span class="price">'+money(p.price)+'</span><span class="add-button">'+(p.price===null?'Ask price':'Add to bag')+'</span></div></div></article>';
}
function edit(id){current=id?products.find(p=>p.id===id):null;if(id&&!current)return;draftId='product-'+crypto.randomUUID();form.reset();clearImage();status('',false,true);dirty=false;
 if(current){for(const k of ['brand','name','description','details','category','sort_order'])form.elements[k].value=current[k];form.elements.visible.value=String(current.visible);form.elements.price_mode.value=current.price===null?'ask':'fixed';form.elements.price.value=current.price??'';}
 else{form.elements.price_mode.value='ask';form.elements.visible.value='false';form.elements.sort_order.value=Math.min(99999,Math.max(-1,...products.map(p=>p.sort_order))+1);}
 $('#editor-title').textContent=current?'Edit listing':'Add product';preview();$('#editor').showModal();form.elements.brand.focus();
}
function close(){if(busy)return;if(dirty&&!confirm('Discard your unsaved changes?'))return;$('#editor').close();clearImage();dirty=false;}
$('#close-editor').addEventListener('click',close);$('#cancel-editor').addEventListener('click',close);$('#editor').addEventListener('cancel',e=>{e.preventDefault();close();});
window.addEventListener('beforeunload',e=>{if(dirty||busy){e.preventDefault();e.returnValue='';}});
form.addEventListener('input',()=>{dirty=true;preview();});form.addEventListener('change',preview);
$('#image-file').addEventListener('change',async()=>{
 const picked=$('#image-file').files[0];clearImage();const ticket=selection;if(!picked){preview();return;}
 try{if(!['image/png','image/webp'].includes(picked.type)||!picked.size||picked.size>5*1024*1024)throw Error('Choose a PNG or WebP cutout up to 5 MB.');
 const bitmap=await createImageBitmap(picked);const valid=bitmap.width>=100&&bitmap.height>=100&&bitmap.width<=8000&&bitmap.height<=8000;bitmap.close();if(!valid)throw Error('Use an image between 100 and 8000 pixels on each side.');if(ticket!==selection)return;
 file=picked;previewURL=URL.createObjectURL(file);$('#image-confirm').required=true;status('Check the preview and confirm the product-only image below.',false,true);dirty=true;
 }catch(e){if(ticket!==selection)return;status(e.message,true,true);}preview();
});
form.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;
 if(!current&&!file){status('Choose a clean product image first.',true,true);return;}if(file&&!$('#image-confirm').checked){status('Please confirm that you checked the product-only image.',true,true);return;}
 if(!form.reportValidity())return;setBusy(true);status('Saving your listing…',false,true);
 try{if(file&&!uploadedURL)uploadedURL=await api.upload(file);const p=data();if(!current)p.id=draftId;
 const saved=await api.save(p,!current);products=products.filter(p=>p.id!==saved.id);products.push(saved);products.sort((a,b)=>a.sort_order-b.sort_order||a.id.localeCompare(b.id));render();dirty=false;$('#editor').close();clearImage();status(saved.visible?'Saved. Refresh the store to see the updated listing.':'Saved as hidden. You can publish it by changing Store visibility.');
 }catch(e){status(e.message+' If the session expired, copy any unsaved text before signing in again.',true,true);}finally{setBusy(false);}
});
$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,button=f.querySelector('button');button.disabled=true;status('Signing in…');
 try{const email=await api.login(f.elements.email.value.trim(),f.elements.password.value);f.elements.password.value='';await reload();$('#account').textContent=email;$('#login-panel').hidden=true;$('#dashboard').hidden=false;$('#signout').hidden=false;status('');}
 catch(e){status(e.message,true);}finally{button.disabled=false;}
});
$('#signout').addEventListener('click',async()=>{if(busy)return;try{await api.logout();}catch{}products=[];$('#admin-list').innerHTML='';$('#dashboard').hidden=true;$('#signout').hidden=true;$('#login-panel').hidden=false;status('Signed out.');});
$('#reload').addEventListener('click',async e=>{e.currentTarget.disabled=true;try{await reload();status('Product list refreshed.');}catch(e){status(e.message,true);}finally{$('#reload').disabled=false;}});
$('#new-product').addEventListener('click',()=>edit());$('#admin-list').addEventListener('click',async e=>{
 const removeButton=e.target.closest('[data-delete]');if(removeButton){
 const product=products.find(p=>p.id===removeButton.dataset.delete);if(!product||busy)return;
 if(!confirm('Permanently delete '+product.brand+' — '+product.name+'? This cannot be undone.'))return;
 removeButton.disabled=true;busy=true;
 try{await api.remove(product.id,product.version);products=products.filter(p=>p.id!==product.id);render();status('Product deleted. The uploaded image remains in storage and can be removed there if unused.');}
 catch(error){status(error.message,true);removeButton.disabled=false;}
 finally{busy=false;}
 return;
 }
 const b=e.target.closest('[data-edit]');if(b)edit(b.dataset.edit);
});
$('#admin-search').addEventListener('input',render);$('#visibility').addEventListener('change',render);
if(api?.configured)$('#login-panel').hidden=false;else $('#setup').hidden=false;
})();
