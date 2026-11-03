(()=>{'use strict';
const PRIVATE_KEY='my-sydney-v1'; // Preserve existing local data.
const DEMO_KEY='my-sydney-demo-v1'; // Never read private data in demo mode.
let KEY=PRIVATE_KEY;
let mode=null;

const dates=['2026-11-14','2026-11-15','2026-11-16','2026-11-17','2026-11-18'];const weekday=['일','월','화','수','목','금','토'];const $=s=>document.querySelector(s);const uid=()=>globalThis.crypto?.randomUUID?.()||String(Date.now())+Math.random().toString(36).slice(2);const initial=()=>({plans:[{id:uid(),date:'2026-11-14',time:'08:20',name:'시드니 공항 도착',note:'입국 심사 및 시내 이동'},{id:uid(),date:'2026-11-14',time:'11:00',name:'메리턴 스위트 월드타워',note:'짐 보관 및 숙소 이동'}],places:[{id:uid(),name:'시드니 오페라하우스',category:'관광',note:'하버 산책과 기념사진',lat:-33.8568,lng:151.2153,expectedBudget:0},{id:uid(),name:'본다이 비치',category:'관광',note:'바다 구경과 해변 산책',lat:-33.8915,lng:151.2767,expectedBudget:25},{id:uid(),name:'퀸 빅토리아 빌딩',category:'쇼핑',note:'쇼핑과 건물 구경',lat:-33.8718,lng:151.2066,expectedBudget:80}],flights:[],hotels:[{id:uid(),name:'Meriton Suites World Tower',address:'95 Liverpool Street, Sydney NSW 2000, Australia',checkin:'2026-11-14',checkout:'2026-11-18',checkinTime:'',checkoutTime:'',bookingRef:'',facilities:'',lat:-33.8761,lng:151.2077,notes:'시설과 예약 관련 내용을 추가해 보세요.'}],expenses:[],packing:['여권','항공권 확인','충전기','돼지코 어댑터','수영복','선크림','상비약'].map(name=>({id:uid(),name,done:false,category:['여권','항공권 확인'].includes(name)?'필수준비물':'개인준비물'}))});const demoInitial=()=>({plans:[{id:uid(),date:'2026-11-14',time:'09:00',name:'Sydney Airport arrival (demo)',note:'가상의 여행 일정입니다.'},{id:uid(),date:'2026-11-15',time:'10:30',name:'Opera House walk',note:'샘플 일정 - 여행지 산책'}],places:[{id:uid(),name:'Sydney Opera House',category:'관광',note:'Sample attraction',lat:-33.8568,lng:151.2153,expectedBudget:0},{id:uid(),name:'Queen Victoria Building',category:'쇼핑',note:'Sample shopping',lat:-33.8718,lng:151.2066,expectedBudget:65},{id:uid(),name:'Harbour Café (Sample)',category:'카페',note:'가상 카페 데이터',lat:-33.8612,lng:151.2108,expectedBudget:16},{id:uid(),name:'Sydney Bistro (Sample)',category:'음식점',note:'가상 음식점 데이터',lat:-33.8740,lng:151.2077,expectedBudget:32}],flights:[{id:uid(),direction:'가는 편',airline:'Sample Airways',flightNumber:'DEMO101',departureAirport:'ICN',departureAt:'2026-11-13T20:00',arrivalAirport:'SYD',arrivalAt:'2026-11-14T08:20',passengers:'SAMPLE GUEST | 12A',notes:'실제 예약이 아닌 데모용 항공편입니다.'}],hotels:[{id:uid(),name:'Harbour View Hotel (Demo)',address:'Sydney NSW, Australia',checkin:'2026-11-14',checkout:'2026-11-18',checkinTime:'15:00',checkoutTime:'11:00',bookingRef:'',facilities:'Wi-Fi\n수영장\n피트니스 센터',lat:-33.8650,lng:151.2100,notes:'가상의 숙소 예시입니다.'}],expenses:[{id:uid(),date:'2026-11-14',name:'Airport train (sample)',amount:24.50,category:'교통'}],packing:[{id:uid(),name:'여권',done:true,category:'필수준비물'},{id:uid(),name:'항공권 확인',done:false,category:'필수준비물'},{id:uid(),name:'충전기',done:false,category:'개인준비물'},{id:uid(),name:'수영복',done:false,category:'개인준비물'}]});
let state;
const knownCoords={'시드니 오페라하우스':[-33.8568,151.2153],'sydney opera house':[-33.8568,151.2153],'본다이 비치':[-33.8915,151.2767],'bondi beach':[-33.8915,151.2767],'퀸 빅토리아 빌딩':[-33.8718,151.2066],'queen victoria building':[-33.8718,151.2066]};
const normalizeName=s=>String(s||'').trim().toLowerCase();
const validCoords=(lat,lng)=>lat!==''&&lng!==''&&lat!=null&&lng!=null&&Number.isFinite(Number(lat))&&Number.isFinite(Number(lng))&&Math.abs(Number(lat))<=90&&Math.abs(Number(lng))<=180;
let map=null,markersLayer=null,searchPoint=null,mapReady=false,mapPendingLocation=null;
function loadWorkspace(){let parsed=null;try{const raw=localStorage.getItem(KEY);parsed=raw?JSON.parse(raw):null}catch{}state=parsed&&['plans','places','expenses','packing'].every(k=>Array.isArray(parsed[k]))?parsed:(mode==='demo'?demoInitial():initial());// Backward compatible: classify items saved in older versions without erasing checked state.
state.packing.forEach(item=>{if(!['필수준비물','개인준비물','호주에서 할 일'].includes(item.category)){item.category=/여권|항공권|비자|여행자.?보험|예약.?확인|신분증|e-?ticket/i.test(item.name)?'필수준비물':'개인준비물';}});
state.flights=Array.isArray(state.flights)?state.flights:[];state.hotels=Array.isArray(state.hotels)?state.hotels:[];state.places.forEach(x=>{if(x.category==='음식')x.category='음식점';if(x.category==='액티비티')x.category='활동';const known=knownCoords[normalizeName(x.name)];if(known&&!validCoords(x.lat,x.lng)){x.lat=known[0];x.lng=known[1]}});state.hotels.forEach(x=>{if(!validCoords(x.lat,x.lng)&&/Meriton Suites World Tower/i.test(x.name)){x.lat=-33.8761;x.lng=151.2077}})}
function enterWorkspace(nextMode,cloudState=null){mode=nextMode;KEY=mode==='demo'?DEMO_KEY:PRIVATE_KEY;if(mode==='cloud'){state=cloudState||{plans:[],places:[],flights:[],hotels:[],expenses:[],packing:[]};}else{loadWorkspace();}$('#welcome').hidden=true;$('#workspace').hidden=false;$('#modeBadge').textContent=mode==='demo'?'DEMO WORKSPACE':mode==='cloud'?'FAMILY CLOUD':'MY TRIP';$('#resetDemoBtn').hidden=mode!=='demo';$('#refreshCloudBtn').hidden=mode!=='cloud';$('#importLocalBtn').hidden=mode!=='cloud'||!window.MySydneyCloud?.isOwner();selectedDate=dates[0];if(mode!=='cloud')save();render();selectTab('overview')}
$('#demoBtn').addEventListener('click',()=>enterWorkspace('demo'));

$('#changeModeBtn').addEventListener('click',async()=>{if(mode==='cloud')await window.MySydneyCloud?.logout();$('#workspace').hidden=true;$('#welcome').hidden=false;mode=null;window.scrollTo(0,0)});
$('#resetDemoBtn').addEventListener('click',()=>{if(mode!=='demo'||!confirm('데모 데이터를 처음 상태로 되돌릴까요?'))return;state=demoInitial();save();render();notify('데모를 초기화했어요.')});
/* Workspace state is loaded only after choosing a mode. */
/* old initializer removed */
let selectedDate=dates[0],editKind=null,editId=null;
const save=()=>{if(mode==='cloud'){window.MySydneyCloud?.queueSave(state);return true;}try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{notify('저장할 수 없어요. 브라우저 저장 공간을 확인해 주세요.');return false}};const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};const empty=label=>el('div','empty',label);const money=n=>'A$'+Number(n||0).toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2});const notify=message=>{const n=$('#toast');n.textContent=message;n.classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>n.classList.remove('show'),2400)};
function buttonAction(label,fn,isDanger=false){const b=el('button','iconbtn'+(isDanger?' danger':''),label);b.type='button';b.setAttribute('aria-label',label==='✎'?'수정':'삭제');b.addEventListener('click',fn);return b}
function itemCard(icon,title,meta,note,kind,obj){const card=el('article','item');card.append(el('div','symbol',icon));const main=el('div','itemmain');main.append(el('h3','',title));if(meta)main.append(el('span','pill',meta));if(note)main.append(el('p','',note));card.append(main);const actions=el('div','actions');actions.append(buttonAction('✎',()=>openEditor(kind,obj)),buttonAction('✕',()=>remove(kind,obj.id),true));card.append(actions);return card}
function render(){const total=state.expenses.reduce((s,x)=>s+Number(x.amount||0),0);// Legacy summary elements were removed in the premium UI; update them only if present.
  const updateLegacyStat=(selector,value)=>{const node=$(selector);if(node)node.textContent=value};
  updateLegacyStat('#statFlights',state.flights.length+'편');
  updateLegacyStat('#statHotels',state.hotels.length+'곳');
  updateLegacyStat('#statPlans',state.plans.length+'개');
  updateLegacyStat('#statPlaces',state.places.length+'곳');
  updateLegacyStat('#statCost','A$'+total.toLocaleString('en-AU',{maximumFractionDigits:0}));$('#expenseTotal').textContent=money(total);renderDates();renderPlans();renderFlights();renderHotels();renderPlaces();renderPlaceBudget();renderExpenses(total);renderPacking();renderMapMarkers();renderOverview(total)}

function selectTab(tab){document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===tab));if(tab==='places'){initializeMap();setTimeout(()=>map?.invalidateSize(),100)}window.scrollTo({top:0,behavior:'instant'});}
function renderOverview(actual){
 const set=(selector,value)=>{const n=$(selector);if(n)n.textContent=value};
 const flight=[...state.flights].sort((a,b)=>String(a.departureAt||'').localeCompare(String(b.departureAt||'')))[0];
 const hotel=state.hotels[0];
 const forecast=state.places.reduce((sum,place)=>sum+(Number(place.expectedBudget)||0),0);
 set('#overviewFlights',state.flights.length+'편');set('#overviewFlightMeta',flight?`${flight.departureAirport||'출발'} → ${flight.arrivalAirport||'도착'} · ${flight.flightNumber||''}`:'항공편을 등록해 주세요');
 set('#overviewHotel',hotel?.name||'숙소 미등록');set('#overviewHotelMeta',hotel?`${hotel.checkin||'체크인 미정'} → ${hotel.checkout||'체크아웃 미정'}`:'호텔 정보를 등록해 주세요');
 set('#overviewPlaces',state.places.length+' Places');set('#overviewPlaceMeta','관광 · 쇼핑 · 카페 · 음식점 · 활동');
 set('#overviewBudget',money(forecast));set('#overviewBudgetSecondary',money(forecast));set('#overviewActual',money(actual));
 const timeline=$('#overviewTimeline');timeline.replaceChildren();const rows=state.plans.filter(x=>x.date===dates[0]).sort((a,b)=>String(a.time||'').localeCompare(String(b.time||''))).slice(0,4);
 if(!rows.length)timeline.append(el('p','overview-muted','아직 첫날 일정이 없어요. 일정표에서 추가해 보세요.'));
 rows.forEach(x=>{const line=el('div','ov-event');line.append(el('span','ov-time',x.time||'—'),el('span','ov-dot'));const details=el('div');details.append(el('strong','',x.name||'일정'));if(x.note)details.append(el('p','',x.note));line.append(details);timeline.append(line)});
 const packing=$('#overviewPacking');packing.replaceChildren();
 ['필수준비물','개인준비물'].forEach(category=>{const subset=state.packing.filter(x=>x.category===category);const done=subset.filter(x=>x.done).length;const percent=subset.length?Math.round(done/subset.length*100):0;
 const item=el('div','ov-packing-item'),heading=el('div','ov-packing-heading');heading.append(el('span','',category),el('strong','',`${done}/${subset.length} · ${percent}%`));const track=el('div','ov-track');const bar=el('div','ov-track-bar');bar.style.width=percent+'%';track.append(bar);item.append(heading,track);packing.append(item)});
 const budgetLines=$('#overviewBudgetLines');budgetLines.replaceChildren();['관광','쇼핑','카페','음식점','활동','기타'].forEach(category=>{const amount=state.places.filter(x=>x.category===category).reduce((sum,x)=>sum+(Number(x.expectedBudget)||0),0);if(!amount)return;const line=el('div','ov-budget-row');line.append(el('span','',category),el('strong','',money(amount)));budgetLines.append(line)});
 if(!budgetLines.children.length)budgetLines.append(el('p','overview-muted','장소에 예상 지출을 입력해 보세요.'));
}

function renderDates(){const bar=$('#datebar');bar.replaceChildren();dates.forEach(d=>{const date=new Date(d+'T12:00:00');const b=el('button','datebtn'+(d===selectedDate?' active':''));b.type='button';b.setAttribute('aria-pressed',String(d===selectedDate));b.append(el('span','',date.getMonth()+1+'월 '+date.getDate()+'일'),el('strong','',weekday[date.getDay()]+'요일'));b.addEventListener('click',()=>{selectedDate=d;renderDates();renderPlans()});bar.append(b)})}
function renderPlans(){const list=$('#planList');list.replaceChildren();const rows=state.plans.filter(x=>x.date===selectedDate).sort((a,b)=>a.time.localeCompare(b.time));if(!rows.length){list.append(empty('이 날짜에는 아직 일정이 없어요. ＋ 일정 추가를 눌러주세요.'));return}rows.forEach(x=>list.append(itemCard('🗓️',x.name,x.time,x.note,'plans',x)))}
// Storage paths are only accessed after family authentication; demo images never use cloud.
async function resolvePlaceImage(place){
  if(mode==='demo')return place.demoImageData||null;
  if(mode==='cloud'&&place.imagePath)return window.MySydneyCloud?.getPlaceImageUrl(place.imagePath)||null;
  return null;
}
function attachPlaceImage(target,place,variant){
  const img=el('img',variant==='card'?'place-photo':'place-popup-photo');
  img.alt=place.name+' 사진';img.loading='lazy';img.hidden=true;
  if(variant==='card')target.insertBefore(img,target.firstChild);else target.append(img);
  const current=place.imagePath||place.demoImageData;
  Promise.resolve(resolvePlaceImage(place)).then(src=>{
    if(!src||(variant==='card'&&!target.isConnected)||current!==(place.imagePath||place.demoImageData))return;
    img.src=src;img.hidden=false;
  }).catch(err=>console.warn('장소 사진을 표시할 수 없습니다:',err));
  img.addEventListener('error',()=>{img.hidden=true;});
}
function renderPlaces(){const list=$('#placeList');list.replaceChildren();const filter=$('#placeCategory').value;const rows=state.places.filter(x=>filter==='all'||x.category===filter);if(!rows.length){list.append(empty('저장된 장소가 없어요.'));return}const icons={'관광':'📸','음식점':'🍜','카페':'☕','쇼핑':'🛍️','활동':'🏄','기타':'📍'};rows.forEach(x=>{const price=x.expectedBudget!==''&&x.expectedBudget!=null?' · 예상 '+money(x.expectedBudget):'';const location=validCoords(x.lat,x.lng)?'📍 지도에 표시됨':'📍 좌표 미등록 · 수정에서 위치를 입력';const card=itemCard(icons[x.category]||'📍',x.name,x.category+price,[x.note,location].filter(Boolean).join('\n'),'places',x);if(x.imagePath||x.demoImageData)attachPlaceImage(card,x,'card');list.append(card)})}
function renderPlaceBudget(){const total=state.places.reduce((sum,x)=>sum+(Number(x.expectedBudget)||0),0);$('#expectedPlacesTotal').textContent=money(total);$('#expectedPlacesCount').textContent=state.places.filter(x=>Number(x.expectedBudget)>0).length+'개 장소에 예상 비용 입력';}
function renderFlights(){const list=$('#flightList');list.replaceChildren();if(!state.flights.length){list.append(empty('아직 등록된 항공편이 없어요. 항공사·편명·출도착 시간과 탑승자를 추가해 보세요.'));return}const flights=[...state.flights].sort((a,b)=>(a.departureAt||'').localeCompare(b.departureAt||''));flights.forEach(x=>{const card=el('article','item');card.append(el('div','symbol','✈️'));const main=el('div','itemmain');main.append(el('span','pill',x.direction||'항공편'),el('h3','',[(x.airline||''),(x.flightNumber||'')].filter(Boolean).join(' · ')));const airport=el('div','flight-route');airport.append(el('strong','',x.departureAirport||'출발지'),el('span','', '→'),el('strong','',x.arrivalAirport||'도착지'));main.append(airport);const fmt=s=>(s||'미입력').replace('T',' ');main.append(el('p','',`출발 ${fmt(x.departureAt)} · 도착 ${fmt(x.arrivalAt)}`));if(x.passengers)main.append(el('p','', '탑승자 / 좌석: '+x.passengers.split('\n').map(s=>s.trim()).filter(Boolean).join(' · ')));if(x.notes)main.append(el('p','',x.notes));card.append(main);const acts=el('div','actions');acts.append(buttonAction('✎',()=>openEditor('flights',x)),buttonAction('✕',()=>remove('flights',x.id),true));card.append(acts);list.append(card)})}
function renderHotels(){const list=$('#hotelList');list.replaceChildren();if(!state.hotels.length){list.append(empty('아직 등록된 호텔이 없어요. 숙소 정보를 추가해 보세요.'));return}state.hotels.forEach(x=>{const card=itemCard('🏨',x.name,`${x.checkin||'미정'} ~ ${x.checkout||'미정'}`,[x.address,x.checkinTime?'체크인 '+x.checkinTime:'',x.checkoutTime?'체크아웃 '+x.checkoutTime:'',x.facilities?'시설·서비스: '+x.facilities:'',x.bookingRef?'예약번호: '+x.bookingRef:'',x.notes].filter(Boolean).join('\n'),'hotels',x);list.append(card)})}
function renderExpenses(total){const list=$('#expenseList');list.replaceChildren();const rows=[...state.expenses].sort((a,b)=>b.date.localeCompare(a.date));if(!rows.length)list.append(empty('아직 지출이 없어요. 첫 지출을 기록해 보세요.'));rows.forEach(x=>list.append(itemCard('💳',x.name,money(x.amount)+' · '+x.category,x.date,'expenses',x)));const cats=['음식','교통','쇼핑','관광','숙박','기타'];const wrap=$('#expenseBreakdown');wrap.replaceChildren();cats.forEach(cat=>{const sum=state.expenses.filter(x=>x.category===cat).reduce((s,x)=>s+Number(x.amount||0),0);if(!sum)return;const line=el('div','categoryline');line.append(el('span','',cat),el('strong','',money(sum)));const bar=el('div','bar');const progress=el('span');progress.style.width=(total?sum/total*100:0)+'%';bar.append(progress);wrap.append(line,bar)});if(total===0)wrap.append(el('p','subtle','지출을 추가하면 분석 결과가 표시돼요.'))}
function renderPacking(){
  for(const [category,listId,countId,progressId] of [
    ['필수준비물','#essentialPackingList','#essentialCount','#essentialProgress'],
    ['개인준비물','#personalPackingList','#personalCount','#personalProgress'],
    ['호주에서 할 일','#experiencePackingList','#experienceCount','#experienceProgress']
  ]){
    const rows=state.packing.filter(x=>x.category===category);
    const completed=rows.filter(x=>x.done).length;
    $(countId).textContent=completed+' / '+rows.length;
    $(progressId).style.width=(rows.length?Math.round(completed/rows.length*100):0)+'%';
    const list=$(listId);list.replaceChildren();
    if(!rows.length)list.append(empty(category==='호주에서 할 일'?'아직 등록한 활동이 없어요. 직접 추가해 보세요.':'아직 준비물이 없어요. 상단에서 추가해 보세요.'));
    rows.forEach(x=>{
      const row=el('article','item');
      const body=el('label','checkrow');const input=el('input');input.type='checkbox';input.checked=!!x.done;
      input.addEventListener('change',()=>{x.done=input.checked;save();render()});
      body.append(input,el('span',x.done?'done':'',x.name));row.append(body);
      const acts=el('div','actions');acts.append(buttonAction('✎',()=>openEditor('packing',x)),buttonAction('✕',()=>remove('packing',x.id),true));row.append(acts);list.append(row)
    });
  }
  const basics=state.packing.filter(x=>x.category!=='호주에서 할 일');
  const completed=basics.filter(x=>x.done).length;
  const pct=basics.length?Math.round(completed/basics.length*100):0;
  $('#packingText').textContent=completed+' / '+basics.length+' 완료';
  $('#packingPct').textContent=pct+'%';
  $('#packingProgress').style.width=pct+'%';
  const experiences=state.packing.filter(x=>x.category==='호주에서 할 일');
  const expDone=experiences.filter(x=>x.done).length;
  const expPct=experiences.length?Math.round(expDone/experiences.length*100):0;
  $('#experienceText').textContent=expDone+' / '+experiences.length+' 완료';
  $('#experiencePct').textContent=expPct+'%';
  $('#experienceTotalProgress').style.width=expPct+'%';
}

function makeMarkerIcon(kind){const symbols={공항:'✈',호텔:'🏨',관광:'📸',쇼핑:'🛍',카페:'☕',음식점:'🍽',활동:'🏄',기타:'📍'};const classes={공항:'airport',호텔:'hotel',관광:'sight',쇼핑:'shop',카페:'cafe',음식점:'food',활동:'activity',기타:'other'};return L.divIcon({className:'sydney-pin-wrap',html:'<span class="sydney-pin '+(classes[kind]||'other')+'">'+(symbols[kind]||'📍')+'</span>',iconSize:[40,46],iconAnchor:[20,42],popupAnchor:[0,-40]})}
function initializeMap(){if(mapReady)return;const container=$('#sydneyMap');if(!container)return;if(location.protocol==='file:'){$('#mapStatus').textContent='📍 지도를 보려면 HTML 파일을 더블클릭하지 말고 VS Code Live Server로 실행해 주세요. 브라우저 주소가 http://127.0.0.1:5500/... 또는 https://... 로 시작해야 해요.';return;}if(typeof L==='undefined'){$('#mapStatus').textContent='지도를 불러올 수 없어요. 인터넷 연결을 확인해 주세요.';return;}map=L.map(container,{scrollWheelZoom:false}).setView([-33.869,151.208],12);const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin'}).addTo(map);let tileErrors=0;tiles.on('tileerror',()=>{tileErrors++;if(tileErrors>=2){$('#mapStatus').textContent='지도 배경을 불러올 수 없어요 (타일 접근 제한). HTML을 더블클릭하지 말고 VS Code Live Server로 실행해 주세요. 그래도 안 되면 다른 지도 서비스가 필요합니다.'}});markersLayer=L.layerGroup().addTo(map);map.on('click',e=>{mapPendingLocation=e.latlng;const coord=`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;$('#mapStatus').textContent='선택한 위치: '+coord+' · 이 위치로 장소를 추가할 수 있어요.';$('#addPinBtn').hidden=false;});mapReady=true;renderMapMarkers();setTimeout(()=>map.invalidateSize(),100)}
function popupNode(title,details,kind,place=null){const root=document.createElement('div');root.className='pin-popup';const h=document.createElement('strong');h.textContent=title;const small=document.createElement('p');small.textContent=details;root.append(h,small);if(place&&(place.imagePath||place.demoImageData))attachPlaceImage(root,place,'popup');return root}
function renderMapMarkers(){if(!mapReady||!markersLayer)return;markersLayer.clearLayers();const bounds=[];const add=(lat,lng,title,subtitle,category,place=null)=>{if(!validCoords(lat,lng))return;const point=[Number(lat),Number(lng)];L.marker(point,{icon:makeMarkerIcon(category)}).bindPopup(popupNode(title,subtitle,category,place)).addTo(markersLayer);bounds.push(point)};
state.hotels.forEach(x=>add(x.lat,x.lng,x.name,[x.address,'체크인 '+(x.checkin||'미정')].filter(Boolean).join(' · '),'호텔'));
const filter=$('#placeCategory').value;state.places.filter(x=>filter==='all'||x.category===filter).forEach(x=>add(x.lat,x.lng,x.name,x.category+(x.expectedBudget!==''&&x.expectedBudget!=null?' · 예상 '+money(x.expectedBudget):'')+(x.note?' · '+x.note:''),x.category,x));
const airports={'SYD':[-33.9399,151.1753],'ICN':[37.4602,126.4407]};const used=new Set();state.flights.forEach(x=>[x.departureAirport,x.arrivalAirport].forEach(code=>{const c=String(code||'').trim().toUpperCase();if(airports[c]&&!used.has(c)){used.add(c);add(airports[c][0],airports[c][1],c==='SYD'?'시드니 국제공항 (SYD)':'인천국제공항 (ICN)',c,'공항')}}));if(!used.has('SYD'))add(-33.9399,151.1753,'시드니 국제공항 (SYD)','공항','공항');}
function setupMapEvents(){const search=$('#mapSearch');$('#mapSearchBtn').addEventListener('click',async()=>{const query=search.value.trim();if(!query)return;const status=$('#mapStatus');status.textContent='장소를 검색하고 있어요…';const btn=$('#mapSearchBtn');btn.disabled=true;try{const url='https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(query+', Australia');const response=await fetch(url,{headers:{'Accept':'application/json'}});if(!response.ok)throw Error('검색 오류');const results=await response.json();if(!results.length){status.textContent='검색 결과가 없어요. 장소명과 지역을 함께 입력해 보세요.';return}const found=results[0];if(!mapReady)initializeMap();if(!mapReady)return;const lat=Number(found.lat),lng=Number(found.lon);if(!validCoords(lat,lng))throw Error('좌표 오류');mapPendingLocation={lat,lng};map.setView([lat,lng],16);L.popup().setLatLng([lat,lng]).setContent(popupNode(found.display_name.split(',')[0],found.display_name,'기타')).openOn(map);status.textContent='검색 결과: '+found.display_name+' · 아래 버튼을 눌러 저장하세요.';$('#addPinBtn').hidden=false}catch(e){status.textContent='검색할 수 없어요. 인터넷 연결을 확인해 주세요.'}finally{btn.disabled=false}});search.addEventListener('keydown',e=>{if(e.key==='Enter'){$('#mapSearchBtn').click()}});$('#addPinBtn').addEventListener('click',()=>{if(!mapPendingLocation)return;openEditor('places');$('#f_lat').value=Number(mapPendingLocation.lat).toFixed(6);$('#f_lng').value=Number(mapPendingLocation.lng).toFixed(6)});$('#showSydneyBtn').addEventListener('click',()=>{if(!mapReady)initializeMap();map?.setView([-33.869,151.208],12)});$('#showAllPinsBtn').addEventListener('click',()=>{if(!mapReady)initializeMap();const bounds=markersLayer?.getLayers().map(x=>x.getLatLng())||[];if(bounds.length)map.fitBounds(L.latLngBounds(bounds),{padding:[25,25],maxZoom:14})})}
const schema={flights:[['direction','구분','select',['가는 편','오는 편','경유 편','기타']],['airline','항공사명','text'],['flightNumber','편명','text'],['departureAirport','출발 공항 (예: ICN)','text'],['departureAt','출발 일시 (현지 시간)','datetime-local'],['arrivalAirport','도착 공항 (예: SYD)','text'],['arrivalAt','도착 일시 (현지 시간)','datetime-local'],['passengers','탑승자와 좌석 (한 줄에 한 명: 이름 | 좌석)','textarea'],['notes','추가 정보 (수하물, 터미널 등)','textarea']],hotels:[['name','숙소명','text'],['address','주소','text'],['checkin','체크인 날짜','date'],['checkout','체크아웃 날짜','date'],['checkinTime','체크인 시간','time'],['checkoutTime','체크아웃 시간','time'],['bookingRef','예약 번호 (공개 저장소에 입력하지 마세요)','text'],['facilities','호텔 시설·서비스 (줄바꿈으로 구분)','textarea'],['lat','위도 (지도 핀용, 선택)','number'],['lng','경도 (지도 핀용, 선택)','number'],['notes','숙소 메모','textarea']],plans:[['date','날짜','select',dates],['time','시간','time'],['name','일정 이름','text'],['note','메모','textarea']],places:[['name','장소 이름','text'],['category','분류','select',['관광','쇼핑','카페','음식점','활동','기타']],['expectedBudget','장소별 예상 지출 (AUD, 선택)','number'],['lat','위도 (지도 핀용, 선택)','number'],['lng','경도 (지도 핀용, 선택)','number'],['note','메모','textarea']],expenses:[['date','날짜','date'],['name','지출 내용','text'],['amount','금액 (AUD)','number'],['category','분류','select',['음식','교통','쇼핑','관광','숙박','기타']]],packing:[['category','분류','select',['필수준비물','개인준비물','호주에서 할 일']],['name','체크리스트 항목 이름','text']]};
function openEditor(kind,obj=null){editKind=kind;editId=obj?.id||null;const names={flights:'항공편',hotels:'호텔',plans:'일정',places:'장소',expenses:'지출',packing:'체크리스트 항목'};$('#dialogTitle').textContent=names[kind]+(obj?' 수정':' 추가');const box=$('#formFields');box.replaceChildren();box.style.display='grid';box.style.gap='13px';schema[kind].forEach(([field,label,type,options])=>{if(kind==='packing'&&field==='category'){options=(obj?.category==='호주에서 할 일'||(!obj&&document.querySelector('.panel.active')?.id==='checklist'))?['호주에서 할 일']:['필수준비물','개인준비물'];}const wrap=el('div','field'),lab=el('label','',label);lab.htmlFor='f_'+field;let input;if(type==='select'){input=el('select');options.forEach(v=>{const opt=el('option','',v);opt.value=v;input.append(opt)})}else if(type==='textarea'){input=el('textarea');input.rows=3}else{input=el('input');input.type=type;if(type==='number'){input.step='any';if(field==='amount'||field==='expectedBudget')input.min='0'}}input.id='f_'+field;input.name=field;input.required=(({flights:['direction','airline','flightNumber','departureAirport','departureAt','arrivalAirport','arrivalAt'],hotels:['name','checkin','checkout'],plans:['date','time','name'],places:['name','category'],expenses:['date','name','amount','category'],packing:['category','name']})[kind]||[]).includes(field);input.value=obj?.[field]??(field==='date'?(kind==='plans'?selectedDate:dates[0]):field==='category'?(kind==='packing'?(document.querySelector('.panel.active')?.id==='checklist'?'호주에서 할 일':'개인준비물'):options[0]):'');wrap.append(lab,input);box.append(wrap)});if(kind==='places'){
  const wrap=el('div','field');const label=el('label','','장소 대표 사진 (선택)');label.htmlFor='placePhotoInput';
  const file=el('input');file.type='file';file.id='placePhotoInput';file.accept='image/jpeg,image/png,image/webp';
  const hint=el('small','photo-hint','JPG · PNG · WebP / 최대 3MB · 가족 사진은 비공개로 저장됩니다.');
  wrap.append(label,file,hint);
  if(obj?.imagePath||obj?.demoImageData){const row=el('label','photo-remove-label');const checkbox=el('input');checkbox.type='checkbox';checkbox.id='removePlacePhoto';row.append(checkbox,document.createTextNode(' 기존 사진 제거'));wrap.append(row);}
  box.append(wrap);
}$('#editor').showModal();const first=box.querySelector('[name="name"]');first?.focus()}
function remove(kind,id){if(!confirm('정말 삭제할까요?'))return;state[kind]=state[kind].filter(x=>x.id!==id);save();render();notify('삭제했어요.')}
$('#editForm').addEventListener('submit',async e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));if('name' in values)values.name=values.name.trim();if(('name' in values)&&!values.name){notify('이름을 입력해 주세요.');return}if(editKind==='hotels'&&values.checkout<values.checkin){notify('체크아웃 날짜를 확인해 주세요.');return}if(editKind==='places'&&values.expectedBudget!==''){values.expectedBudget=Number(values.expectedBudget);if(!Number.isFinite(values.expectedBudget)||values.expectedBudget<0){notify('예상 비용은 0 이상의 숫자로 입력해 주세요.');return}}if(editKind==='expenses'){values.amount=Number(values.amount);if(!Number.isFinite(values.amount)||values.amount<=0){notify('올바른 금액을 입력해 주세요.');return}}const old=state[editKind].find(x=>x.id===editId);
  const nextId=old?.id||uid();
  if(editKind==='places'){
    const file=$('#placePhotoInput')?.files?.[0];
    const remove=$('#removePlacePhoto')?.checked;
    if(file){
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>3*1024*1024){notify('JPG/PNG/WebP 사진만 3MB 이하로 올려주세요.');return;}
      const btn=$('#editForm button[type="submit"]');btn.disabled=true;btn.textContent='사진 업로드 중…';
      try{
        if(mode==='cloud'){
          if(!window.MySydneyCloud?.uploadPlaceImage)throw Error('cloud.js 파일을 최신 버전으로 교체해 주세요.');
          values.imagePath=await window.MySydneyCloud.uploadPlaceImage(file,nextId);
          values.demoImageData=null;
        }else if(mode==='demo'){
          // Demo images stay inside the demo browser, never in the family bucket.
          if(file.size>650*1024)throw Error('데모에서는 650KB 이하 이미지만 저장할 수 있어요.');
          values.demoImageData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});
          values.imagePath=null;
        }else throw Error('로그인 후 사진을 추가해 주세요.');
      }catch(err){notify('사진 업로드 실패: '+(err.message||err));return;}
      finally{btn.disabled=false;btn.textContent='저장하기';}
    }else if(remove){values.imagePath=null;values.demoImageData=null;}
  }
  if(old)Object.assign(old,values);else state[editKind].push({id:nextId,...values,...(editKind==='packing'?{done:false}:{})});
  save();$('#editor').close();render();notify('저장했어요!')});$('#closeDialog').onclick=$('#cancelDialog').onclick=()=>$('#editor').close();$('#editor').addEventListener('click',e=>{if(e.target===$('#editor'))$('#editor').close()});document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.add)));document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.tab)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.go)));$('#placeCategory').addEventListener('change',()=>{renderPlaces();renderMapMarkers()});
setupMapEvents();$('#exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({app:'My Sydney',version:2,exportedAt:new Date().toISOString(),data:state},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='my-sydney-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('백업 파일을 저장했어요.')});window.MySydneyCore={enterCloud:(data)=>enterWorkspace('cloud',data),setCloudState:(data)=>{if(mode!=='cloud')return;state=data;render()},getCloudState:()=>structuredClone(state),getLegacyState:()=>{const raw=localStorage.getItem(PRIVATE_KEY);return raw?JSON.parse(raw):null}};/* First render occurs after selecting a mode. */})();
