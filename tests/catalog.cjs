const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').join(__dirname,'..')+require('node:path').sep;
const read=f=>fs.readFileSync(root+f,'utf8');
function dom(){const nodes={};function node(s){return nodes[s]??=( {value:'',innerHTML:'',textContent:'',hidden:false,open:false,disabled:false,dataset:{},style:{setProperty(){},removeProperty(){}},classList:{add(){},remove(){},toggle(){}},listeners:{},addEventListener(k,f){this.listeners[k]=f;},setAttribute(){},showModal(){this.open=true;},close(){this.open=false;},querySelector(){return node(s+' button');},replaceChildren(...c){this.children=c;},elements:{address:{setCustomValidity(){}}}});}
 const document={querySelector:node,querySelectorAll:()=>[],listeners:{},addEventListener(k,f){this.listeners[k]=f;},createElement:()=>({click(){this.clicked=true;}})};return {document,node,nodes};}
function appContext(api,bag={}){const d=dom(),storage={value:JSON.stringify(bag)};const c={...d,window:{DMSCatalog:api,matchMedia:()=>({matches:false,addEventListener(){}}),removeEventListener(){},addEventListener(){}},localStorage:{getItem:()=>storage.value,setItem:(_,v)=>storage.value=v},setTimeout,clearTimeout,cancelAnimationFrame(){},requestAnimationFrame(){},URL,console};vm.createContext(c);vm.runInContext(read('app.js')+'\n;globalThis.test={get products(){return PRODUCTS},get bag(){return bag},get state(){return catalogState},SHOP,renderProducts,showDetail,sanitizeCart,buildInquiry,loadCatalog};',c);return {...d,c,api:c.test,storage};}
function service(fetcher,cfg={url:'https://test.supabase.co',publishableKey:'sb_publishable_test'}){const c={window:{DMS_ADMIN_CONFIG:cfg},fetch:fetcher,URL,Blob,AbortSignal,crypto:require('node:crypto').webcrypto,Date};vm.createContext(c);vm.runInContext(read('catalog-service.js'),c);return c.window.DMSCatalog;}
const response=(data,status=200)=>({ok:status<400,status,json:async()=>data,text:async()=>JSON.stringify(data)});
(async()=>{
 for(const file of ['app.js','admin.js','catalog-service.js','admin-config.js'])new vm.Script(read(file));
 const original=appContext(undefined,{'cetaphil-cream':1,cerave:2});
 assert.equal(original.api.products.length,14);assert.equal(original.api.SHOP.whatsapp,'94712150911');
 original.node('#search').value='cetaphil';original.api.renderProducts();assert.match(original.node('#product-grid').innerHTML,/Ask for price/);assert.doesNotMatch(original.node('#product-grid').innerHTML,/data-add=/);
 assert.equal(JSON.stringify(original.api.bag),'{"cerave":2}');
 const msg=original.api.buildInquiry({cerave:2},{name:'Test',phone:'0770000000',method:'Store pickup',address:'',notes:''});assert.match(msg,/LKR 16,000/);
 const product={...original.api.products[0],sort_order:0,version:1,visible:true};
 let calls=[];let next=[];const api=service(async(url,options)=>{calls.push({url,options});return response(next.shift());});
 assert(api.configured);assert(!service(()=>{}, {url:'https://test.supabase.co',publishableKey:'sb_secret_do_not_accept'}).configured);
 assert.throws(()=>api.validate({...product,image:'javascript:alert(1)'}));assert.throws(()=>api.validate({...product,image:'assets/../secret.png'}));assert.throws(()=>api.validate({...product,sort_order:-1}));assert.throws(()=>api.validate({...product,price:-1}));
 assert(api.imageAllowed('https://test.supabase.co/storage/v1/object/public/product-images/123.png'));assert(!api.imageAllowed('https://evil.example/x.png'));
 next=[[]];assert.equal((await api.list()).length,0);assert(!calls.at(-1).options.headers.Authorization);
 next=[{access_token:'test-token',expires_in:3600,user:{email:'owner@example.test'}},true];assert.equal(await api.login('owner@example.test','not-a-real-password'),'owner@example.test');
 next=[[{...product,version:2}]];await api.save(product,false);const save=calls.at(-1);assert.match(save.url,/version=eq.1/);const body=JSON.parse(save.options.body);assert(!('id' in body));assert(!('version' in body));assert.equal(save.options.headers.Authorization,'Bearer test-token');
 next=[[]];await assert.rejects(api.save(product,false),/changed in another session/);
 next=[{}];const url=await api.upload(new Blob(['image'],{type:'image/png'}));assert.match(url,/\/product-images\/[a-f0-9-]+\.png$/);await assert.rejects(api.upload(new Blob(['x'],{type:'image/svg+xml'})),/PNG or WebP/);
 next=[{}];await api.logout();await assert.rejects(api.list(true),/session has expired/);
 next=[{access_token:'nonowner',expires_in:3600,user:{email:'no@example.test'}},false];await assert.rejects(api.login('no@example.test','invalid'),/not an approved/);await assert.rejects(api.list(true),/session has expired/);
 let rows=[{...product,id:'safe',brand:'<script>alert(1)</script>',price:100}],fail=false;
 const connected=appContext({configured:true,list:async()=>{if(fail)throw Error('offline');return rows;}},{safe:2,cerave:1});await connected.api.loadCatalog();assert.equal(connected.api.products.length,1);assert.equal(JSON.stringify(connected.api.bag),'{"safe":2}');assert.match(connected.node('#product-grid').innerHTML,/&lt;script&gt;/);assert.doesNotMatch(connected.node('#product-grid').innerHTML,/<script>/);
 fail=true;await assert.rejects(connected.api.loadCatalog());assert.equal(connected.api.products.length,0);assert.equal(connected.api.state,'error');assert.match(connected.node('#product-grid').innerHTML,/Try again/);assert.equal(connected.storage.value,'{"safe":2}');
 fail=false;rows=[];await connected.api.loadCatalog();assert.equal(connected.api.products.length,0);assert.equal(connected.api.state,'ready');assert.equal(connected.storage.value,'{}');
 for(const path of ['index.html','admin.html']){for(const m of read(path).matchAll(/(?:src|href)="([^"#?]+)(?:\?[^" ]*)?"/g)){if(m[1].startsWith('http')||m[1].startsWith('tel:'))continue;assert(fs.existsSync(root+m[1]),path+' missing '+m[1]);}}
 const index=read('index.html');assert(index.includes('https://wa.me/94714150911'));assert(index.includes('https://wa.me/94712150911'));
 const css=read('styles.css');assert(/@media\s*\(min-width:\s*1024px\)/.test(css));assert(read('app.js').includes('(min-width:1024px) and (prefers-reduced-motion:no-preference)'));
 console.log('PASS: syntax; 14 static products; inquiry-only/cart totals; contacts; API key restriction; image and price validation; owner login gate; authorized update/version conflict; uploads; logout; non-owner rejection; remote loading/error/empty catalog; stale bag cleanup; XSS escaping; local asset links; desktop motion preserved.');
})().catch(e=>{console.error(e);process.exitCode=1;});
