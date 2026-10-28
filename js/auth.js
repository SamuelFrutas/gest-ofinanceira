const DB='gf3_auth';
const HASH='d2747e1f71f2332c0b1f11e46374689744d2cc1c660c7188c20c86c50ad122a5';

const el=id=>document.getElementById(id);

const dbp=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('credentials',{keyPath:'id'});
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
});

async function hash(value){
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

async function seed(){
  const db=await dbp;
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('credentials','readwrite');
    tx.objectStore('credentials').put({id:'main',passwordHash:HASH});
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
}

async function getPasswordHash(){
  const db=await dbp;
  return new Promise((resolve,reject)=>{
    const request=db.transaction('credentials').objectStore('credentials').get('main');
    request.onsuccess=()=>resolve(request.result?.passwordHash);
    request.onerror=()=>reject(request.error);
  });
}

function showApp(unlocked){
  el('loginScreen').classList.toggle('hidden',unlocked);
  el('appShell').classList.toggle('app-hidden',!unlocked);
}

async function init(){
  await seed();
  if(sessionStorage.getItem('gf3_unlocked')==='1'){
    showApp(true);
    return;
  }
  showApp(false);
  el('loginForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const password=el('loginPassword').value;
    try{
      const valid=(await hash(password))===(await getPasswordHash());
      if(valid){
        sessionStorage.setItem('gf3_unlocked','1');
        el('loginError').textContent='';
        el('loginPassword').value='';
        showApp(true);
      }else{
        el('loginError').textContent='Senha incorreta.';
        el('loginPassword').value='';
        el('loginPassword').focus();
      }
    }catch(error){
      console.error(error);
      el('loginError').textContent='Não foi possível validar a senha.';
    }
  });
}

init().catch(error=>{
  console.error(error);
  const errorBox=el('loginError');
  if(errorBox) errorBox.textContent='Não foi possível iniciar o acesso.';
});