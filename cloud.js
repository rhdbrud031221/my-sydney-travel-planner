(()=>{'use strict';
const $=s=>document.querySelector(s);
const cfg=window.MY_SYDNEY_CONFIG;
const db=(window.supabase && cfg?.url && cfg?.publishableKey)
  ?window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true}}):null;
let tripId=null,role=null,remoteVersion=null,dirty=false,saving=false,saveTimer=null,poll=null,pending=null;
const cats=['plans','places','flights','hotels','expenses','packing'];
const empty=()=>Object.fromEntries(cats.map(k=>[k,[]]));
const clean=data=>Object.fromEntries(cats.map(k=>[k,Array.isArray(data?.[k])?data[k]:[]]));
const status=(s)=>{const e=$('#modeBadge');if(e)e.textContent=s;};
const alertError=(p,e)=>alert(p+'\n'+(e?.message||e||'알 수 없는 오류'));
function isOwner(){return role==='owner';}
async function logout(){signedPhotoCache.clear();clearInterval(poll);clearTimeout(saveTimer);if(dirty){await flush();}if(db)await db.auth.signOut();tripId=null;role=null;remoteVersion=null;dirty=false;}
async function login(email,password,expectedRole,button){
  if(!db){alert('Supabase 라이브러리를 불러오지 못했어요. 인터넷 연결을 확인하세요.');return;}
  const original=button.textContent;button.disabled=true;button.textContent='로그인 중…';
  try{
    const {data:auth,error:authError}=await db.auth.signInWithPassword({email,password});
    if(authError)throw authError;
    const {data:members,error:memberError}=await db.from('trip_members').select('trip_id,member_role').eq('user_id',auth.user.id);
    if(memberError)throw memberError;
    const chosen=(members||[]).find(x=>x.member_role===expectedRole);
    if(!chosen)throw Error('이 계정은 선택한 로그인 종류로 접근할 권한이 없습니다.');
    role=chosen.member_role;tripId=chosen.trip_id;
    const {data:trip,error:tripError}=await db.from('trips').select('name').eq('id',tripId).single();
    if(tripError)throw tripError;
    const current=await getRemote();
    const data=current?.details?.data?clean(current.details.data):empty();
    remoteVersion=current?.updated_at||null;
    dirty=false;pending=null;
    window.MySydneyCore.enterCloud(data);
    status((isOwner()?'OWNER':'FAMILY')+' · '+trip.name);
    startPolling();
  }catch(e){await db.auth.signOut();tripId=null;role=null;alertError('로그인 실패:',e);}
  finally{button.disabled=false;button.textContent=original;}
}
async function getRemote(){
  const {data,error}=await db.from('trip_items').select('id,details,updated_at').eq('trip_id',tripId).eq('item_type','workspace').maybeSingle();
  if(error)throw error;
  return data;
}
function queueSave(nextState){if(!tripId)return;pending=JSON.parse(JSON.stringify(clean(nextState)));dirty=true;status('● 저장 대기 중');clearTimeout(saveTimer);saveTimer=setTimeout(flush,700);}
async function flush(){
  if(saving||!dirty||!tripId)return;
  saving=true;const snapshot=pending;dirty=false;status('클라우드에 저장 중…');
  try{
    const {data,error}=await db.from('trip_items').upsert({trip_id:tripId,item_type:'workspace',details:{data:snapshot},updated_at:new Date().toISOString()},{onConflict:'trip_id,item_type'}).select('updated_at').single();
    if(error)throw error;
    remoteVersion=data.updated_at;
    if(!dirty)status((isOwner()?'OWNER':'FAMILY')+' · 저장됨');
  }catch(e){dirty=true;status('⚠ 저장 실패 · 다시 시도');console.error('Cloud save failed',e);alertError('클라우드 저장 실패 (현재 화면의 입력 내용은 유지됩니다):',e);}
  finally{saving=false;if(dirty){clearTimeout(saveTimer);saveTimer=setTimeout(flush,1300);}}
}
async function refresh(force=false){
  if(!tripId)return;
  if(dirty||saving){if(force)alert('저장 대기 중인 내용이 있어요. 잠시 뒤 다시 시도해 주세요.');return;}
  try{
    const current=await getRemote();
    if(current&&current.updated_at!==remoteVersion){
      remoteVersion=current.updated_at;
      window.MySydneyCore.setCloudState(clean(current.details?.data));
      status((isOwner()?'OWNER':'FAMILY')+' · 최신 정보 반영');
    }else if(force){status((isOwner()?'OWNER':'FAMILY')+' · 최신 상태');}
  }catch(e){if(force)alertError('새로고침 실패:',e);}
}
function startPolling(){clearInterval(poll);poll=setInterval(()=>refresh(false),15000);}
// Photos live in a private bucket. Only workspace members can read/upload them.
const PHOTO_BUCKET='place-photos';
const signedPhotoCache=new Map();
async function uploadPlaceImage(file,placeId){
  if(!db||!tripId)throw Error('로그인이 필요합니다.');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>3*1024*1024)throw Error('3MB 이하 JPG/PNG/WebP를 선택해 주세요.');
  const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
  const path=tripId+'/'+placeId+'/'+crypto.randomUUID()+'.'+ext;
  const {error}=await db.storage.from(PHOTO_BUCKET).upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
  if(error)throw error;
  return path;
}
async function getPlaceImageUrl(path){
  if(!db||!tripId||typeof path!=='string'||!path.startsWith(tripId+'/'))return null;
  const cached=signedPhotoCache.get(path);
  if(cached&&cached.until>Date.now())return cached.url;
  const {data,error}=await db.storage.from(PHOTO_BUCKET).createSignedUrl(path,3600);
  if(error)throw error;
  signedPhotoCache.set(path,{url:data.signedUrl,until:Date.now()+50*60*1000});
  return data.signedUrl;
}
window.MySydneyCloud={queueSave,logout,isOwner,uploadPlaceImage,getPlaceImageUrl};
$('#ownerLoginForm').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;login(form.elements.email.value.trim(),form.elements.password.value,'owner',form.querySelector('button'));});
$('#familyLoginForm').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;const family=cfg?.familyEmail?.trim();if(!family||family.includes('REPLACE_WITH_')){alert('먼저 config.js의 familyEmail을 Supabase에 등록한 가족 공용 이메일로 설정해 주세요.');return;}login(family,form.elements.password.value,'member',form.querySelector('button'));});
$('#refreshCloudBtn').addEventListener('click',()=>refresh(true));
$('#importLocalBtn').addEventListener('click',()=>{
  if(!isOwner())return;
  let old;try{old=window.MySydneyCore.getLegacyState()}catch{}
  if(!old){alert('기존 브라우저 저장 데이터가 없어요. 기존 file:// 데이터는 Live Server와 저장 공간이 다를 수 있어요.');return;}
  if(!confirm('현재 클라우드 여행 데이터를 기존 이 브라우저의 여행 데이터로 교체할까요? 먼저 클라우드 데이터 백업을 권장합니다.'))return;
  const imported=clean(old);
  window.MySydneyCore.setCloudState(imported);
  queueSave(imported);
  alert('기존 여행 정보를 불러왔어요. 상단의 저장 상태를 확인해 주세요.');
});
})();
