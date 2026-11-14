/* Shared validation and Supabase access. No credentials or admin sessions in storage. */
(function(){
'use strict';
const categories=['Skincare','Haircare','Body care','Beauty supplements'];
const shots=['0% 0%','50% 0%','100% 0%','0% 100%','50% 100%','100% 100%'];
const cfg=window.DMS_ADMIN_CONFIG||{};
const configured=Boolean(cfg.enabled!==false&&/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.url||'')&&/^sb_publishable_[a-zA-Z0-9_-]+$/.test(cfg.publishableKey||''));
let token='',expiresAt=0;
function sessionError(message){return Object.assign(Error(message),{code:'SESSION_EXPIRED'});}
const text=(v,max,required=true)=>{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw Error('Please check the product text fields.');return v.trim();};
function imageAllowed(value){
 if(typeof value!=='string')return false;
 if(/^assets\/[a-zA-Z0-9_./-]+\.(webp|png|jpe?g)$/.test(value)&&!value.includes('..'))return true;
 try{const u=new URL(value);return configured&&u.origin===cfg.url&&u.pathname.startsWith('/storage/v1/object/public/product-images/')&&!u.search&&!u.hash&&!/["'<>\\]/.test(value);}catch{return false;}
}
function validate(p){
 if(!p||typeof p.id!=='string'||!/^[-a-z0-9]{1,80}$/.test(p.id))throw Error('Invalid product ID.');
 if(['constructor','prototype'].includes(p.id))throw Error('Invalid product ID.');
 if(!categories.includes(p.category))throw Error('Choose a listed category.');
 if(p.price!==null&&(!Number.isFinite(p.price)||p.price<=0||p.price>10000000))throw Error('Enter a valid price or choose Ask for price.');
 if(!Number.isInteger(p.sort_order??0)||(p.sort_order??0)<0||(p.sort_order??0)>99999)throw Error('Display order must be a whole number from 0 to 99999.');
 if(p.version!=null&&(!Number.isInteger(p.version)||p.version<1))throw Error('Invalid product version.');
 if(!imageAllowed(p.image))throw Error('Choose a valid product image.');
 if(p.shot!=null&&!shots.includes(p.shot))throw Error('Invalid legacy image.');
 if(p.shot&&p.cutout)throw Error('Product image settings conflict.');
 return {id:p.id,brand:text(p.brand,80),name:text(p.name,120),category:p.category,price:p.price,image:p.image,
 description:text(p.description,180),details:text(p.details,1600),shot:p.shot||null,cutout:Boolean(p.cutout),
 visible:p.visible!==false,sort_order:Number.isInteger(p.sort_order)&&p.sort_order>=0?p.sort_order:0,
 version:Number.isInteger(p.version)?p.version:1};
}
function authHeaders(){
 if(!token||Date.now()>=expiresAt){token='';throw Error('Your session has expired. Sign in again; your unsaved form is still here.');}
 return {Authorization:'Bearer '+token};
}
async function request(path,{method='GET',body,auth=false,headers={}}={}){
 if(!configured)throw Error('The product manager is not connected yet.');
 const res=await fetch(cfg.url+path,{method,headers:{apikey:cfg.publishableKey,...(auth?authHeaders():{}),...(body instanceof Blob?{}:{'Content-Type':'application/json'}),...headers},body:body==null?undefined:body instanceof Blob?body:JSON.stringify(body),signal:AbortSignal.timeout(20000),cache:'no-store'});
 if(!res.ok){let d={};try{d=await res.json();}catch{}
 if(res.status===401){token='';throw sessionError('Please sign in again.');}
 if(res.status===403)throw Error('This account does not have permission to manage products.');
 throw Error(d.message||d.error_description||'Could not save or load. Please try again.');}
 if(res.status===204)return null;
 const data=await res.text();return data?JSON.parse(data):null;
}
async function login(email,password){
 const session=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
 token=session.access_token;expiresAt=Date.now()+session.expires_in*1000;
 try{const allowed=await request('/rest/v1/rpc/is_shop_admin',{method:'POST',body:{},auth:true});if(allowed!==true)throw Error('Your account is not an approved shop administrator.');}
 catch(error){token='';expiresAt=0;throw error;}
 return session.user.email;
}
async function logout(){try{if(token)await request('/auth/v1/logout',{method:'POST',auth:true});}finally{token='';expiresAt=0;}}
async function list(admin=false){
 let result=[];
 for(let offset=0;offset<10000;offset+=500){
 const rows=await request('/rest/v1/products?select=*&'+(admin?'':'visible=eq.true&')+'order=sort_order.asc,id.asc&limit=500&offset='+offset,{auth:admin});
 if(!Array.isArray(rows))throw Error('Invalid catalog response.');
 result.push(...rows.map(validate));if(rows.length<500)return result;
 }
 throw Error('Catalog is too large to load completely.');
}
async function save(product,isNew){
 const p=validate(product),version=p.version,id=p.id;delete p.version;if(!isNew)delete p.id;
 const rows=await request('/rest/v1/products'+(isNew?'':'?id=eq.'+encodeURIComponent(id)+'&version=eq.'+version),
 {method:isNew?'POST':'PATCH',body:p,auth:true,headers:{Prefer:'return=representation'}});
 if(!rows||rows.length!==1)throw Error('This product changed in another session. Reload the product list before saving.');
 return validate(rows[0]);
}
async function remove(id,version){
 if(typeof id!=='string'||!/^[-a-z0-9]{1,80}$/.test(id)||['constructor','prototype'].includes(id)||!Number.isInteger(version)||version<1)throw Error('Invalid product selection.');
 const rows=await request('/rest/v1/products?id=eq.'+encodeURIComponent(id)+'&version=eq.'+version,{method:'DELETE',auth:true,headers:{Prefer:'return=representation'}});
 if(!rows||rows.length!==1)throw Error('This product changed or was already removed. Refresh the product list.');
 return validate(rows[0]);
}
async function upload(file){
 if(!file||!['image/png','image/webp'].includes(file.type)||!file.size||file.size>5*1024*1024)throw Error('Use a PNG or WebP product cutout, up to 5 MB.');
 const extension=file.type==='image/png'?'png':'webp',path=crypto.randomUUID()+'.'+extension;
 await request('/storage/v1/object/product-images/'+path,{method:'POST',auth:true,body:file,headers:{'Content-Type':file.type,'x-upsert':'false'}});
 return cfg.url+'/storage/v1/object/public/product-images/'+path;
}
window.DMSCatalog=Object.freeze({categories,configured,validate,imageAllowed,login,logout,list,save,remove,upload});
})();
