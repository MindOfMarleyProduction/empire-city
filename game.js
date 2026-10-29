/**
 * EMPIRE CITY — Mind of Marley Games / Build 2.0
 * Original procedural 3D open-world action-game vertical slice.
 * Browser-ready PlayCanvas Engine, no proprietary GTA V assets or copied code.
 */
import * as pc from 'playcanvas';

const $ = id => document.getElementById(id);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const lerp = (a, b, k) => a + (b-a)*k;
const rad = Math.PI / 180;
const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
const pick = (array, seed) => array[Math.abs(seed)%array.length];
const pt = (x,z) => ({x,z});
const SAVE = 'mmg-empire-city-campaign-v2';
const PREF = 'mmg-empire-city-settings-v2';
const ROADS = [-126,-84,-42,0,42,84,126];
const BLOCKS = [-105,-63,-21,21,63,105];
const WORLD_LIMIT = 146;
const SITE = {
  start:pt(3,5), contact:pt(0,-2), garage:pt(0,84), club:pt(-84,-42),
  docks:pt(126,84), uptown:pt(-84,-84), corporate:pt(42,-42),
  market:pt(-42,84), rivals:pt(-84,84), business:pt(-42,42),
  studio:pt(42,42), plaza:pt(0,-42), shop:pt(42,84),
  safehouse:pt(0,0), harbor:pt(126,126), parking:pt(0,22)
};
const MISSIONS = [
  {name:'WELCOME TO EMPIRE CITY',reward:750,steps:[
    {type:'reach',at:'contact',text:'Meet your contact at Central Square.'},
    {type:'interact',at:'contact',text:'Speak with your contact. Press USE.'},
    {type:'enterCar',at:'parking',text:'Enter the parked muscle car.'},
    {type:'drive',at:'garage',text:'Drive the car to the Uptown garage.'}]},
  {name:'THE RIGHT CONNECTIONS',reward:1100,steps:[
    {type:'reach',at:'club',text:'Travel to the club in Westside.'},
    {type:'interact',at:'club',text:'Meet the club owner. Press USE.'},
    {type:'collect',at:'market',text:'Pick up the documents at the market.'},
    {type:'deliver',at:'contact',text:'Deliver the documents to your contact.'}]},
  {name:'FIRST BUSINESS',reward:850,steps:[
    {type:'reach',at:'business',text:'Inspect the property in Midtown.'},
    {type:'purchase',at:'business',text:'Buy the first M.M.G. business for $1,000.'},
    {type:'reach',at:'studio',text:'Visit the M.M.G. media office.'}]},
  {name:'THE FAST LANE',reward:1500,steps:[
    {type:'enterCar',at:'parking',text:'Get into a vehicle.'},
    {type:'race',at:'plaza',text:'Drive to the Downtown checkpoint.'},
    {type:'race',at:'corporate',text:'Reach the Financial District checkpoint.'},
    {type:'race',at:'shop',text:'Reach the Eastside checkpoint.'},
    {type:'race',at:'garage',text:'Finish at the Uptown garage.'}]},
  {name:'HEAT CHECK',reward:2200,steps:[
    {type:'reach',at:'corporate',text:'Meet the anonymous contact in the Financial District.'},
    {type:'heat',at:'corporate',text:'Avoid the police as the setup unfolds.'},
    {type:'escape',at:'safehouse',text:'Evade the police until your wanted level reaches zero.'},
    {type:'reach',at:'safehouse',text:'Return to your safehouse.'}]},
  {name:'PORT AUTHORITY',reward:1850,steps:[
    {type:'reach',at:'docks',text:'Head to the docks on the east waterfront.'},
    {type:'collect',at:'docks',text:'Collect the shipping documents.'},
    {type:'enterCar',at:'parking',text:'Get a vehicle for the delivery.'},
    {type:'deliverDrive',at:'uptown',text:'Deliver the shipment to the Uptown contact.'}]},
  {name:'WESTSIDE TROUBLE',reward:2700,steps:[
    {type:'reach',at:'rivals',text:'Investigate the rival crew near North Westside.'},
    {type:'fight',at:'rivals',text:'Defeat the three rival enforcers. Use HIT or F.'},
    {type:'escape',at:'safehouse',text:'Shake off any pursuing police.'},
    {type:'reach',at:'contact',text:'Report back to your contact.'}]},
  {name:'THE NIGHT SHIFT',reward:3200,steps:[
    {type:'enterCar',at:'parking',text:'Get behind the wheel.'},
    {type:'race',at:'club',text:'Race to Westside.'},
    {type:'race',at:'uptown',text:'Race through Uptown.'},
    {type:'race',at:'harbor',text:'Race to the Waterfront.'},
    {type:'race',at:'corporate',text:'Finish in the Financial District.'}]},
  {name:'BRAND EXPANSION',reward:3600,steps:[
    {type:'reach',at:'studio',text:'Meet your new business partners.'},
    {type:'interact',at:'studio',text:'Approve the M.M.G. media deal.'},
    {type:'collect',at:'plaza',text:'Collect the signed contracts.'},
    {type:'deliver',at:'business',text:'Return the contracts to your first business.'}]},
  {name:'POWER MOVES',reward:4000,steps:[
    {type:'reach',at:'docks',text:'Visit the harbor investor.'},
    {type:'interact',at:'docks',text:'Negotiate the harbor investment.'},
    {type:'reach',at:'corporate',text:'Make your way to the Financial District.'},
    {type:'interact',at:'corporate',text:'Finalize the deal.'}]},
  {name:'CITY LIMITS',reward:5000,steps:[
    {type:'enterCar',at:'parking',text:'Find a fast vehicle.'},
    {type:'race',at:'rivals',text:'Checkpoint 1: North Westside.'},
    {type:'race',at:'uptown',text:'Checkpoint 2: Uptown.'},
    {type:'race',at:'harbor',text:'Checkpoint 3: Waterfront.'},
    {type:'race',at:'plaza',text:'Checkpoint 4: Downtown.'},
    {type:'race',at:'contact',text:'Cross the finish line at Central Square.'}]},
  {name:'THE EMPIRE RISES',reward:10000,steps:[
    {type:'collect',at:'market',text:'Secure the Westside business records.'},
    {type:'collect',at:'docks',text:'Secure the harbor holdings.'},
    {type:'collect',at:'corporate',text:'Secure the Downtown contracts.'},
    {type:'deliver',at:'studio',text:'Deliver the final documents to M.M.G.'},
    {type:'reach',at:'contact',text:'Return to Central Square and finish the campaign.'}]}
];

const state = {
  active:false,paused:false,freeRoam:false,mission:0,step:0,money:2500,health:100,
  wanted:0,heat:0,heatCooldown:0,character:'MARLEY',inCar:null,
  playerPos:{x:3,z:5},yaw:0,moveY:0,vy:0,
  time:16.5,elapsed:0,ticks:0,radio:false,menuOpen:false,
  businesses:[],ownedVehicles:[],shownTutorial:false,missionTimer:0,raceTimer:0,
  nextMissionDelay:0,combatRemaining:3,damageTimer:0,toastClock:0,
  actionDown:false,spawnedEnemies:false
};
const prefs = (()=>{try{return JSON.parse(localStorage.getItem(PREF))||{quality:'mobile',music:false}}catch{return {quality:'mobile',music:false}}})();
const joy={x:0,z:0,id:null}; const look={id:null,lastX:0};
const held=new Set(); let sprintHeld=false; const padLast={};
let app,device,camera,sun,player,playerMesh,objective,objectiveStem,objectiveRing;
let camHeading=0,camPitch=18,carEntity=null,toastExpires=0,uiTicks=0,audio=null;
let buildingColliders=[],buildingGroups=[],people=[],cars=[],police=[],rivals=[],trees=[],lamps=[],allMaterials={},textureCache={};
const carTypes={
  MUSCLE:{max:27,accel:16,drag:.985,turn:54,scale:1.05},
  COUPE:{max:34,accel:19,drag:.988,turn:61,scale:.91},
  SEDAN:{max:24,accel:13,drag:.982,turn:51,scale:1},
  SUV:{max:21,accel:11,drag:.979,turn:44,scale:1.23},
  SPORT:{max:38,accel:23,drag:.989,turn:68,scale:.89},
  TRUCK:{max:18,accel:10,drag:.978,turn:40,scale:1.32}
};
const characterStyles={MARLEY:{skin:[.40,.24,.17],shirt:[.15,.14,.21],pants:[.065,.08,.13],hair:[.06,.055,.06]},ACE:{skin:[.57,.34,.23],shirt:[.12,.25,.34],pants:[.09,.11,.14],hair:[.075,.055,.04]},NOVA:{skin:[.32,.21,.16],shirt:[.33,.16,.22],pants:[.11,.1,.11],hair:[.07,.06,.05]}};

function saveGame(){try{localStorage.setItem(SAVE,JSON.stringify({mission:state.mission,step:state.step,money:state.money,health:state.health,character:state.character,businesses:state.businesses,ownedVehicles:state.ownedVehicles,time:state.time,playerPos:state.playerPos}))}catch{}}
function loadGame(){try{return JSON.parse(localStorage.getItem(SAVE)||'null')}catch{return null}}
function savePrefs(){try{localStorage.setItem(PREF,JSON.stringify(prefs))}catch{}}
function setText(id,text){$(id).textContent=String(text)}
function showError(error){$('loading').classList.add('hidden');$('error').classList.remove('hidden');$('error').textContent='EMPIRE CITY failed to start.\nCheck your internet connection and enable WebGL 2.\n\n'+(error?.message||String(error));console.error(error)}
function message(text,duration=3){setText('message',text);$('message').classList.remove('hidden');toastExpires=state.elapsed+duration;beep(620,.1)}
function missionPoint(step){
  if(step?.type==='enterCar'){
    const eligible=cars.filter(car=>!car.ai);
    if(eligible.length){return eligible.reduce((a,b)=>distance(state.playerPos,a)<distance(state.playerPos,b)?a:b)}
  }
  return SITE[step?.at]||SITE.contact;
}
function mark(){if(!objective)return;const step=currentStep();objective.enabled=!!step&&state.active&&!state.freeRoam&&step.type!=='escape'&&step.type!=='heat';if(step){const p=missionPoint(step);objective.setPosition(p.x,.05,p.z)}}
function currentStep(){return MISSIONS[state.mission]?.steps[state.step]||null}
function region(x,z){if(x>70)return 'WATERFRONT';if(x<-35&&z>5)return 'WESTSIDE';if(z<-35&&x>0)return 'FINANCIAL DISTRICT';if(z<-35)return 'UPTOWN';if(z>40)return 'EASTSIDE';return 'DOWNTOWN'}
function deltaAngle(a,b){return ((a-b+540)%360)-180}
function mat(key,rgb,opts={}){
  if(allMaterials[key])return allMaterials[key];
  const m=new pc.StandardMaterial();m.diffuse=new pc.Color(...rgb);m.useMetalness=!!opts.metal;
  m.metalness=opts.metal ? .38 : 0;m.shininess=opts.shiny?84:26;
  if(opts.emission){m.emissive=new pc.Color(...rgb).mulScalar(opts.emission)}
  if(opts.texture){m.diffuseMap=opts.texture}
  m.update();allMaterials[key]=m;return m;
}
function texture(key,painter,width=256,height=256){
  if(textureCache[key])return textureCache[key];
  const c=document.createElement('canvas');c.width=width;c.height=height;
  painter(c.getContext('2d'),width,height);
  const t=new pc.Texture(device,{width,height,format:pc.PIXELFORMAT_RGBA8,mipmaps:true});
  t.setSource(c);textureCache[key]=t;return t;
}
function facade(key,base,windowTint,litRatio=.3){
  const t=texture(key,(g,w,h)=>{
    g.fillStyle=base;g.fillRect(0,0,w,h);
    let seed=key.length*2741;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
    for(let y=7;y<h-4;y+=18){
      g.fillStyle='#1a222b';g.fillRect(0,y-1,w,2);
      for(let x=8;x<w-4;x+=20){
        g.fillStyle=rand()<litRatio?windowTint:'#172a39';g.fillRect(x,y,12,12);
        g.fillStyle='rgba(255,255,255,.10)';g.fillRect(x+1,y+1,2,9);
        g.fillStyle='rgba(0,0,0,.40)';g.fillRect(x,y+10,12,2);
      }
    }
    g.fillStyle='#29313d';g.fillRect(0,0,5,h);g.fillRect(w-5,0,5,h);
  });
  return mat('facade-'+key,[.96,.96,.96],{texture:t});
}
function signMaterial(main,sub='',bg='#101827'){
  const key='sign'+main+sub;if(allMaterials[key])return allMaterials[key];
  const t=texture(key,(g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.strokeStyle='#d9b676';g.lineWidth=9;g.strokeRect(5,5,w-10,h-10);g.textAlign='center';g.fillStyle='#f2d29b';g.font='900 45px sans-serif';g.fillText(main,w/2,h*.47);g.fillStyle='#e9e4db';g.font='700 15px sans-serif';g.fillText(sub,w/2,h*.69)} ,512,256);
  const m=new pc.StandardMaterial();m.diffuseMap=t;m.emissiveMap=t;m.emissive=new pc.Color(.45,.45,.45);m.update();allMaterials[key]=m;return m;
}
function box(parent,name,x,y,z,sx,sy,sz,material,type='box'){
  const e=new pc.Entity(name);e.addComponent('render',{type,material});
  e.setLocalPosition(x,y,z);e.setLocalScale(sx,sy,sz);parent.addChild(e);return e;
}
function group(name,x=0,z=0){const e=new pc.Entity(name);e.setPosition(x,0,z);app.root.addChild(e);return e}
function addCollider(x,z,w,d){buildingColliders.push({minX:x-w*.5,maxX:x+w*.5,minZ:z-d*.5,maxZ:z+d*.5})}
function navigable(x,z,radius=.42){
  if(Math.abs(x)>WORLD_LIMIT||Math.abs(z)>WORLD_LIMIT)return false;
  for(const c of buildingColliders){if(x+radius>c.minX&&x-radius<c.maxX&&z+radius>c.minZ&&z-radius<c.maxZ)return false}
  return true;
}
function createMaterials(){
  mat('grass',[.21,.28,.22]);mat('street',[.13,.15,.17]);mat('walk',[.35,.35,.35]);
  mat('roadLine',[.77,.67,.46]);mat('concrete',[.36,.37,.39]);mat('curb',[.55,.54,.51]);
  mat('dark',[.055,.072,.09]);mat('metal',[.23,.24,.29],{metal:true});
  mat('gold',[.82,.56,.24],{metal:true});mat('glass',[.14,.26,.35],{metal:true,shiny:true});
  mat('windowGlow',[.74,.64,.36],{emission:.48});mat('red',[.65,.09,.09],{emission:.2});
  mat('white',[.86,.84,.75]);mat('blue',[.15,.40,.52]);mat('purple',[.32,.15,.39]);
  mat('treeTrunk',[.28,.20,.14]);mat('leaf',[.15,.29,.20]);mat('leaf2',[.22,.34,.23]);
  mat('sand',[.40,.37,.32]);mat('water',[.08,.19,.29],{metal:true,shiny:true});
  mat('light',[.96,.89,.70],{emission:.9});mat('tire',[.027,.034,.043]);
  mat('asphaltEdge',[.20,.22,.24]);mat('brick',[.31,.24,.20]);
  facade('financial','#2c3d4c','#81b0b9',.32);
  facade('luxury','#4d525e','#ffe5a7',.42);
  facade('brick','#654c45','#e7b66a',.16);
  facade('industrial','#5d6167','#8c9aa6',.13);
  facade('residential','#7a746a','#efdb9e',.31);
  facade('hotel','#2f4256','#ffd68e',.4);
}
function createLandmark(x,z,label,sub){
  const parent=group(label,x,z);
  box(parent,'store front',0,2.1,0,10,4.2,10,allMaterials.brick);
  box(parent,'entrance',0,1.4,5.07,3.2,2.8,.12,allMaterials.glass);
  box(parent,'door handle',1,1.3,5.15,.1,.4,.12,allMaterials.gold);
  box(parent,'canopy',0,3.7,5.6,11,.3,2.2,allMaterials.metal);
  box(parent,label+' sign',0,4.6,5.16,9,1.5,.13,signMaterial(label,sub));
  addCollider(x,z,10.4,10.4);
}
function addBuilding(x,z,w,d,height,type,brand=false){
  const parent=group('Building',x,z);const facades=['facade-financial','facade-luxury','facade-brick','facade-industrial','facade-residential','facade-hotel'];
  const material=allMaterials[facades[type%facades.length]];
  box(parent,'textured building',0,height*.5,0,w,height,d,material);
  box(parent,'roof coping',0,height+.22,0,w+.35,.45,d+.35,allMaterials.metal);
  box(parent,'ground storefront',0,1.5,d*.5+.1,w*.88,2.9,.17,allMaterials.glass);
  box(parent,'storefront awning',0,3.1,d*.5+.67,w*.94,.25,1.25,allMaterials.concrete);
  if(height>23){
    box(parent,'mechanical room',0,height+.76,0,w*.36,1.2,d*.4,allMaterials.concrete);
    box(parent,'aerial',0,height+1.9,0,.12,2,.12,allMaterials.gold,'cylinder');
  }
  if(brand){box(parent,'M.M.G. billboard',0,height*.71,d*.5+.2,w*.91,2.9,.13,signMaterial('M.M.G.','MIND OF MARLEY GAMES'))}
  // Build 3.0 citywide facade upgrade: stronger silhouettes and repeated architectural details.
  // Each building gets architectural trims rather than only a single rectangular box.
  const trim = type%3===0 ? allMaterials.gold : type%3===1 ? allMaterials.metal : allMaterials.concrete;
  const levels=Math.max(2,Math.min(8,Math.floor(height/4.6)));
  for(let floor=1;floor<=levels;floor++){
    const y=Math.min(height-.45,(floor-.35)*height/(levels+.35));
    if(y<3.6)continue;
    // Horizontal cornices also hide the previous flat wall silhouette.
    box(parent,'facade belt '+floor,0,y,0,w+.20,.12,d+.20,trim);
  }
  // More varied rooftop profile, substantial enough to read from street level.
  if(type%3===0){
    box(parent,'roof parapet front',0,height+.55,d/2,w+.18,1.1,.35,trim);
    box(parent,'roof parapet rear',0,height+.55,-d/2,w+.18,1.1,.35,trim);
  } else if(type%3===1) {
    box(parent,'rooftop equipment',-w*.21,height+.9,0,w*.31,1.55,d*.37,allMaterials.metal);
    box(parent,'roof vent',w*.22,height+.4,0,w*.24,.8,d*.2,allMaterials.dark);
  } else {
    box(parent,'entry column L',-w*.43,1.7,d*.5+.33,.32,3.4,.46,trim);
    box(parent,'entry column R',w*.43,1.7,d*.5+.33,.32,3.4,.46,trim);
    box(parent,'entrance canopy',0,3.58,d*.5+.75,w*.87,.22,1.42,trim);
  }
  // Vertical corner accents convey scale without hundreds of individual window meshes.
  for(const edge of [-1,1]){
    box(parent,'corner pilaster front',edge*w*.485,height*.50,d*.50+.07,.16,height,.16,trim);
    box(parent,'corner pilaster back',edge*w*.485,height*.50,-d*.50-.07,.16,height,.16,trim);
  }
  addCollider(x,z,w+.3,d+.3);
  buildingGroups.push({root:parent,x,z});
}
function addTree(x,z,kind=0){
  const e=group('Street tree',x,z);
  box(e,'trunk',0,1.2,0,.35,2.4,.35,allMaterials.treeTrunk,'cylinder');
  box(e,'canopy',0,3.25,0,2.35,3.1,2.35,kind?allMaterials.leaf2:allMaterials.leaf,'sphere');
  trees.push(e);
}
function addStreetLight(x,z){
  const e=group('Streetlamp',x,z);
  box(e,'pole',0,3.3,0,.16,6.6,.16,allMaterials.metal,'cylinder');
  box(e,'lamp arm',.8,6.5,0,1.6,.17,.18,allMaterials.metal);
  box(e,'light',1.4,6.32,0,.9,.18,.36,allMaterials.light);
  lamps.push(e);
}
function createCity(){
  createMaterials();
  box(app.root,'terrain',0,-.33,0,310,.6,310,allMaterials.grass);
  box(app.root,'harbor water',156,-.25,0,42,.12,350,allMaterials.water);
  box(app.root,'harbor edge',143,.05,0,3,.22,294,allMaterials.sand);
  for(const r of ROADS){
    box(app.root,'North-South Boulevard',r,.015,0,12,.14,292,allMaterials.street);
    box(app.root,'East-West Boulevard',0,.02,r,292,.14,12,allMaterials.street);
    for(let p=-143;p<=143;p+=13){
      if(Math.min(...ROADS.map(q=>Math.abs(q-p)))<8)continue;
      box(app.root,'road lane marker',r,.098,p,.14,.009,4.4,allMaterials.roadLine);
      box(app.root,'road lane marker',p,.099,r,4.4,.009,.14,allMaterials.roadLine);
    }
  }
  for(const cx of BLOCKS)for(const cz of BLOCKS){
    const seed=Math.abs((cx*31+cz*43+721)|0);
    box(app.root,'sidewalk plot',cx,.065,cz,30,.18,30,allMaterials.walk);
    if((cx===-21&&cz===21)||(cx===63&&cz===105)){
      box(app.root,'park',cx,.17,cz,24,.2,24,allMaterials.grass);
      for(let i=0;i<6;i++){const x=cx-8+(i%3)*8,z=cz-8+Math.floor(i/3)*16;addTree(x,z,i%2)}
      box(app.root,'park fountain',cx,.38,cz,5,.5,5,allMaterials.concrete,'cylinder');
      box(app.root,'park sculpture',cx,1.75,cz,1.4,2.5,1.4,allMaterials.gold,'sphere');
      continue;
    }
    if(cx===21&&cz===21){addBuilding(cx+7,cz+7,11,11,33,1,true);addBuilding(cx-7,cz-7,11,11,18,2);continue}
    const downtown=(cx>0&&cz<20);const uptown=cz<-50;const docks=cx>60&&cz>10;
    const count=(seed%4===0)?2:4;
    const spots=[[-7.5,-7.5],[7.5,-7.5],[-7.5,7.5],[7.5,7.5]];
    for(let i=0;i<count;i++){
      const [dx,dz]=spots[i],n=(seed+i*61)%17;
      const h=downtown?24+n*2.9:uptown?11+n*1.3:docks?6+n*.76:9+n*1.7;
      const w=11.7+(n%3)*.37;
      addBuilding(cx+dx,cz+dz,w,w,h,downtown?(n%2):docks?3:uptown?4:n%6);
    }
    if(seed%3===0){addTree(cx-13,cz+12,seed%2);addTree(cx+13,cz-12,(seed+1)%2)}
  }
  // Distinct M.M.G.-branded neighborhood businesses (visual landmarks, interact at road waypoints).
  addStreetLight(6,-6);addStreetLight(-6,6);addStreetLight(-90,48);addStreetLight(49,-90);
  for(let i=-126;i<=126;i+=42){for(let j=-126;j<=126;j+=42){if((Math.abs(i+j)/42)%2===0)addStreetLight(i+5,j+5)}}
  for(let z=65;z<=125;z+=12){box(app.root,'cargo container',133,1.4,z,5,2.8,7,pick([allMaterials.red,allMaterials.metal,allMaterials.blue],z));}
  // Road details: crosswalks, pedestrian curb ramps, intersection signals and barriers.
  for(const a of [-84,-42,0,42,84])for(const b of [-84,-42,0,42,84]){
    for(let i=-3;i<=3;i++){
      box(app.root,'pedestrian crossing stripe',a+i*1.35,.103,b+7.0,1.00,.008,2.0,allMaterials.white);
      box(app.root,'pedestrian crossing stripe',a+7.0,.103,b+i*1.35,2.0,.008,1.00,allMaterials.white);
    }
    const light=group('Traffic signal',a+5,b-5);
    box(light,'signal mast',0,2.4,0,.16,4.8,.16,allMaterials.metal,'cylinder');
    box(light,'signal head',0,4.5,0,.66,1.25,.42,allMaterials.dark);
    box(light,'red signal',0,4.82,.24,.22,.22,.08,allMaterials.red,'sphere');
    box(light,'green signal',0,4.21,.24,.22,.22,.08,allMaterials.leaf,'sphere');
  }
  // Objectives and business signs near publicly walkable road junctions.
  const signs=[['M.M.G. MEDIA',SITE.studio],['MARLEY MOTORS',SITE.garage],['M.M.G. HOLDINGS',SITE.business],['THE CIRCUIT',SITE.club]];
  for(const [name,p]of signs){
    const g=group(name+' street sign',p.x+5,p.z+7);
    box(g,'pole',0,2.2,0,.16,4.4,.16,allMaterials.metal,'cylinder');
    box(g,'sign',0,4.65,0,7.2,2.1,.17,signMaterial(name,''));
  }
}

function createHuman(name,x,z,style='MARLEY',variant=0){
  const s=characterStyles[style]||characterStyles.MARLEY;
  const skin=mat('skin-'+style,s.skin),shirt=mat('shirt-'+style,s.shirt),pants=mat('pants-'+style,s.pants),hair=mat('hair-'+style,s.hair);
  const sneakers=allMaterials.white,trim=allMaterials.gold;
  const root=group(name,x,z);
  const hips=box(root,'hips',0,1.02,0,.62,.4,.38,pants);
  const torso=box(root,'tailored jacket',0,1.56,0,.79,.88,.41,shirt);
  box(root,'shirt seam',0,1.63,.215,.04,.60,.012,trim);
  box(root,'neck',0,2.07,0,.23,.23,.23,skin,'cylinder');
  const face=box(root,'head',0,2.35,0,.51,.63,.46,skin,'sphere');
  box(root,'nose',0,2.30,.228,.13,.16,.11,skin);
  for(const xEye of [-.12,.12]){
    box(root,'brow',xEye,2.47,.212,.15,.05,.055,hair);
    box(root,'eye',xEye,2.40,.24,.085,.048,.03,allMaterials.dark,'sphere');
  }
  box(root,'chin beard',0,2.12,.16,.34,.12,.17,hair);
  box(root,'hair top',0,2.68,-.015,.56,.21,.48,hair,'sphere');
  box(root,'shirt collar left',-.18,1.98,.223,.20,.11,.05,allMaterials.white);
  box(root,'shirt collar right',.18,1.98,.223,.20,.11,.05,allMaterials.white);
  if(style==='MARLEY'){
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2;
      const lock=box(root,'dreadlock',Math.cos(a)*.25,2.58-Math.abs(Math.sin(a))*.09,Math.sin(a)*.17,.095,.34+(i%2)*.14,.09,hair,'cylinder');
      lock.setLocalEulerAngles(0,0,12+i*8);
    }
  }else if(style==='NOVA'){box(root,'hair bun',0,2.77,-.15,.43,.32,.42,hair,'sphere')}
  const limbs={};
  for(const side of [-1,1]){
    const arm=group('Arm pivot',0,0);root.addChild(arm);arm.setLocalPosition(side*.48,1.86,0);
    box(arm,'sleeve',side*.025,-.27,0,.25,.59,.31,shirt);
    box(arm,'hand',side*.025,-.67,.015,.18,.27,.23,skin,'sphere');
    const leg=group('Leg pivot',0,0);root.addChild(leg);leg.setLocalPosition(side*.18,.93,0);
    box(leg,'trouser',0,-.38,0,.29,.70,.33,pants);
    box(leg,'shoe',0,-.78,.095,.33,.16,.52,sneakers);
    limbs[side===-1?'leftArm':'rightArm']=arm;
    limbs[side===-1?'leftLeg':'rightLeg']=leg;
  }
  if(variant===1){box(root,'shoulder patch',-.42,1.7,.21,.14,.26,.02,trim)}
  return {root,limbs,torso,face};
}
function createCar(x,z,kind='SEDAN',color='blue',id='',parked=true){
  const data=carTypes[kind];const v=group('Vehicle '+id,x,z);
  const palette={blue:[.12,.31,.47],black:[.095,.105,.14],red:[.44,.10,.11],gold:[.53,.33,.14],white:[.64,.66,.67],purple:[.29,.14,.35],green:[.14,.26,.19]};
  const paint=mat('paint-'+color,palette[color]||palette.blue,{metal:true,shiny:true});
  const scale=data.scale;v.setLocalScale(scale,scale,scale);
  box(v,'steel chassis',0,.65,0,2.05,.62,4.2,paint);
  box(v,'front hood',0,.94,1.43,1.96,.13,1.18,paint);
  // Subtle mobile-friendly decorative geometry and color variation.
  box(v,'hood centerline',0,1.02,1.47,.045,.015,1.08,allMaterials.metal);
  box(v,'front splitter',0,.28,2.20,1.94,.075,.20,allMaterials.dark);
  const roof=box(v,'sloped cabin',0,1.26,-.35,1.75,.74,2.16,allMaterials.glass);
  roof.setLocalEulerAngles(-5,0,0);
  box(v,'top roof',0,1.65,-.40,1.68,.11,1.63,paint);
  box(v,'grille',0,.62,2.15,1.4,.25,.075,allMaterials.dark);
  box(v,'rear grille',0,.62,-2.16,1.4,.24,.07,allMaterials.metal);
  box(v,'front bumper',0,.39,2.12,1.95,.18,.19,allMaterials.metal);
  box(v,'rear bumper',0,.39,-2.12,1.96,.18,.16,allMaterials.metal);
  const wheels=[];
  for(const side of [-1,1])for(const zWheel of [-1.35,1.35]){
    const tire=box(v,'rubber wheel',side*1.08,.43,zWheel,.72,.25,.72,allMaterials.tire,'cylinder');
    tire.setLocalEulerAngles(0,0,90);
    box(v,'wheel alloy',side*1.19,.43,zWheel,.12,.36,.36,allMaterials.metal,'cylinder').setLocalEulerAngles(0,0,90);
    wheels.push(tire);
  }
  for(const side of [-1,1]){
    box(v,'headlight',side*.68,.76,2.18,.46,.18,.08,allMaterials.light);
    box(v,'taillight',side*.67,.80,-2.19,.50,.17,.07,allMaterials.red);
    box(v,'side mirror',side*1.06,1.29,.43,.19,.16,.32,paint);
    box(v,'door handle',side*1.04,1.02,-.52,.06,.06,.37,allMaterials.metal);
    box(v,'side skirt',side*1.04,.39,-.2,.08,.12,2.22,allMaterials.dark);
    box(v,'wheel hub',side*1.29,.43,1.35,.05,.15,.15,allMaterials.gold,'cylinder').setLocalEulerAngles(0,0,90);
  }
  if(kind==='SPORT'){box(v,'rear spoiler',0,1.1,-2.04,2.17,.14,.42,allMaterials.dark)}
  if(kind==='TRUCK'){box(v,'truck bed',0,1.2,-1.65,2.12,.5,1.3,paint)}
  if(kind==='SUV'){box(v,'roof rack',0,1.84,-.45,1.86,.17,2.0,allMaterials.metal)}
  box(v,'M.M.G. rear license plate',0,.50,-2.23,.77,.30,.07,signMaterial('M.M.G.','EMPIRE CITY'));
  const car={root:v,kind,color,id:id||kind,parked,speed:0,yaw:0,x,z,initialX:x,initialZ:z,wheels,damage:0,ai:false};
  cars.push(car);return car;
}
function createPeopleAndCars(){
  playerMesh=createHuman('Player',SITE.start.x,SITE.start.z,state.character,1);player=playerMesh.root;
  const parked=[
    [3,22,'MUSCLE','red'],[-43,15,'COUPE','blue'],[43,58,'SUV','black'],
    [-85,-30,'SEDAN','white'],[-43,86,'SPORT','gold'],[82,44,'TRUCK','green'],
    [126,-78,'COUPE','purple'],[-126,50,'SEDAN','white'],[83,124,'SPORT','blue']
  ];
  parked.forEach(([x,z,kind,color],i)=>createCar(x,z,kind,color,'P-'+i,true));
  const flowPaths=[
    [pt(-126,-126),pt(126,-126),pt(126,126),pt(-126,126)],
    [pt(-84,-84),pt(84,-84),pt(84,84),pt(-84,84)],
    [pt(-42,-126),pt(-42,126),pt(42,126),pt(42,-126)],
    [pt(-126,0),pt(126,0),pt(126,42),pt(-126,42)]
  ];
  for(let i=0;i<20;i++){
    const type=pick(['SEDAN','SEDAN','SUV','COUPE','MUSCLE','TRUCK'],i*7);
    const colors=['black','white','blue','gold','red','green'];
    const car=createCar(0,0,type,pick(colors,i*3+Math.floor(i/5)),'TRAFFIC-'+i,false);
    car.ai=true;car.path=flowPaths[i%flowPaths.length];car.seg=i%4;car.t=(i*.193)%1;
    car.cruise=8+(i%5)*1.5;
  }
  for(let i=0;i<43;i++){
    const cx=BLOCKS[i%6],cz=BLOCKS[Math.floor(i/6)%6],angle=(i*2.18)%6.28;
    const style=pick(['ACE','NOVA','MARLEY'],i);
    const human=createHuman('Citizen '+i,cx+Math.cos(angle)*14.3,cz+Math.sin(angle)*14.3,style);
    people.push({model:human,cx,cz,angle,speed:.10+(i%5)*.05,style,fled:0,stunned:0});
  }
  for(let i=0;i<3;i++){
    const human=createHuman('Rival enforcer '+i,SITE.rivals.x+i*2,SITE.rivals.z-4,'ACE');
    const p={model:human,x:SITE.rivals.x+i*2,z:SITE.rivals.z-4,down:false};rivals.push(p);
  }
  for(let i=0;i<3;i++){
    const car=createCar(-124+i*4,-120,'SEDAN','black','POLICE-'+i,false);
    car.ai=true;car.police=true;car.root.enabled=false;police.push(car);
  }
}
// Build 3.0 Real Models: only a few instances are loaded to protect tablet performance.
// If any GLB fails, its existing primitive remains visible and gameplay continues.
function loadRealModel(path, onReady) {
  app.assets.loadFromUrl('assets/' + path, 'container', (err, asset) => {
    if (err || !asset?.resource) {console.warn('[Empire City] Model unavailable:',path,err);return;}
    try {onReady(asset.resource);} catch (e) {console.warn('[Empire City] Asset setup failed:',path,e);}
  });
}
function replaceWithRealModel(root, resource, scale, offset=[0,0,0], yaw=0) {
  const model=resource.instantiateRenderEntity();
  if (!model) return false;
  model.name='Build 3.0 GLB';
  model.setLocalScale(scale,scale,scale);
  model.setLocalPosition(offset[0],offset[1],offset[2]);
  model.setLocalEulerAngles(0,yaw,0);
  const oldChildren=[...root.children];
  root.addChild(model);
  // Retain primitive hierarchy for fallback, but hide it only after successful GLB instantiation.
  for(const child of oldChildren) child.enabled=false;
  return true;
}
function enableRealModels(){
  // Uploaded Nathan GLB is centimeter-scaled. Only three pedestrians initially use it.
  loadRealModel('nathan_walking.glb',resource=>{
    for(const citizen of people.slice(0,3)){
      // Not a full skeletal animation player yet: the NPC path moves the imported model as a whole.
      replaceWithRealModel(citizen.model.root,resource,.013,[0,.02,0],180);
    }
    message('NEW 3D PEDESTRIANS LOADED',2);
  });
  // This is the user's uploaded VW police transport GLB, not a new generated shape.
  loadRealModel('police_transporter.glb',resource=>{
    const targets=[...police];
    const parkedVan=cars.find(c=>c.id==='P-2');if(parkedVan)targets.push(parkedVan);
    for(const car of targets){
      // root already has the vehicle scale; 0.75 brings the imported vehicle closer to the hitbox.
      replaceWithRealModel(car.root,resource,.75,[.03,.012,.11],180);
    }
    message('NEW 3D VEHICLE LOADED',2);
  });
  loadRealModel('street_buildings.glb',resource=>{
    // The uploaded model's measured footprint is ~18 x 24 x 8m.
    // Spread it across the grid, including near spawn, rather than in one remote block.
    const blocks=[[-21,-21],[21,-21],[-63,-21],[63,-21],[-105,-21],
      [-21,-63],[21,-63],[-63,-63],[63,-63],[105,-63],
      [-21,63],[21,63],[-63,63],[63,63],[-105,63],[105,63]];
    let placed=0;
    for(const [x,z] of blocks){
      const root=group('Real 3D streetscape '+placed,x,z);
      const model=resource.instantiateRenderEntity();
      if(!model){root.destroy();continue}
      // Original model is 18x24m and only 8m tall. Use its original size,
      // ensuring buildings don't swallow neighboring roads.
      model.setLocalScale(1,1,1);
      model.setLocalPosition(1,0,2);
      model.setLocalEulerAngles(0,(placed%4)*90,0);
      root.addChild(model);
      // Hide the four placeholders belonging to that city block.
      // Keep their collision zones for now, so existing missions remain safe.
      for(const b of buildingGroups){
        if(Math.abs(b.x-x)<14 && Math.abs(b.z-z)<14){b.root.enabled=false;b.replacedByGLB=true;}
      }
      buildingGroups.push({root,x,z,realAsset:true});placed++;
    }
    message(placed+' REAL 3D BUILDING BLOCKS LOADED',4);
    console.info('[Empire City] Distributed real GLB city blocks:',placed);
  });
}

function createObjective(){
  objective=group('Mission objective',0,0);
  objectiveRing=box(objective,'objective ring',0,.18,0,3.7,.14,3.7,allMaterials.gold,'cylinder');
  objectiveStem=box(objective,'gold waypoint pillar',0,3.1,0,.28,5.7,.28,allMaterials.windowGlow||allMaterials.gold,'cylinder');
  box(objective,'top glow',0,6,0,.85,.85,.85,allMaterials.light,'sphere');
}
function resetRivals(){state.combatRemaining=3;for(let i=0;i<rivals.length;i++){rivals[i].down=false;rivals[i].model.root.enabled=true}}
function nearPoint(key,r=4){const p=state.inCar?state.inCar:SITE.start;const playerPosition=state.inCar?state.inCar:state.playerPos;return distance(playerPosition,SITE[key])<r}
function nearestCar(radius=6.0){
  let nearest=null,best=radius;
  for(const car of cars){if(car.ai||car===state.inCar)continue;const d=distance(state.playerPos,car);if(d<best){best=d;nearest=car}}
  return nearest;
}
function nearbyPerson(radius=3){
  let closest=null,best=radius;
  for(const npc of people){if(npc.stunned>0)continue;const p=npc.model.root.getPosition();const d=Math.hypot(p.x-state.playerPos.x,p.z-state.playerPos.z);if(d<best){best=d;closest=npc}}
  return closest;
}
function increaseWanted(n=1){state.wanted=clamp(state.wanted+n,0,5);state.heatCooldown=30+state.wanted*10;state.heat=1;}
function heal(amount){state.health=clamp(state.health+amount,0,100)}
function missionStepAdvance(){
  if(state.freeRoam||!currentStep())return;
  const mission=MISSIONS[state.mission];state.step++;
  if(state.step>=mission.steps.length){
    state.money+=mission.reward;
    message('MISSION COMPLETE • +$'+mission.reward.toLocaleString('en-US'),5);
    if(state.mission===MISSIONS.length-1){state.mission=MISSIONS.length;state.step=0;message('CAMPAIGN COMPLETE • EMPIRE CITY IS YOURS',9)}
    else{state.mission++;state.step=0;state.nextMissionDelay=4;}
  }else{
    message('OBJECTIVE COMPLETE',1.8);
  }
  if(currentStep()?.type==='fight')resetRivals();
  if(currentStep()?.type==='race')state.raceTimer=0;
  if(currentStep()?.type==='heat'){increaseWanted(2);state.step++;message('POLICE ALERT • LOSE YOUR WANTED LEVEL',4)}
  saveGame();mark();
}
function outsideVehicle(px,pz,except=null,margin=.40){
  for(const car of cars){
    if(car===except)continue;
    const dx=px-car.x,dz=pz-car.z,a=car.yaw*rad;
    const side=dx*Math.cos(a)-dz*Math.sin(a);
    const front=dx*Math.sin(a)+dz*Math.cos(a);
    const scale=carTypes[car.kind]?.scale||1;
    if(Math.abs(side)<1.1*scale+margin && Math.abs(front)<2.15*scale+margin)return false;
  }
  return true;
}
function findSafeExit(car){
  const s=carTypes[car.kind]?.scale||1;
  const yaw=car.yaw*rad;
  for(const radius of [2.15*s,2.9*s,3.7*s,5*s,7*s]){
    for(const angle of [Math.PI/2,-Math.PI/2,Math.PI,-Math.PI/4,Math.PI/4,0,3*Math.PI/4,-3*Math.PI/4]){
      const x=car.x+Math.sin(yaw+angle)*radius;
      const z=car.z+Math.cos(yaw+angle)*radius;
      if(navigable(x,z,.5)&&outsideVehicle(x,z,car,.47))return {x,z,recovered:false};
    }
  }
  for(const spot of [SITE.start,SITE.contact,SITE.garage,SITE.plaza]){
    if(navigable(spot.x,spot.z,.5)&&outsideVehicle(spot.x,spot.z,null,.45))return {...spot,recovered:true};
  }
  return {...SITE.start,recovered:true};
}
function interact(){
  if(!state.active||state.paused)return;
  soundAction();
  if(state.inCar){
    const car=state.inCar;
    const p=findSafeExit(car);
    // Emergency recovery is preferable to trapping the player forever.
    state.inCar=null;state.playerPos={x:p.x,z:p.z};player.enabled=true;
    state.moveY=0;state.vy=0;
    player.setPosition(p.x,0,p.z);car.speed=0;message(p.recovered?'PLAYER RECOVERED • SAFE POSITION':'EXITED VEHICLE',1.8);
    saveGame();
    return;
  }
  const step=currentStep(),at=step&&SITE[step.at],here=at&&distance(state.playerPos,at)<5;
  if(here&&['interact','collect','deliver','purchase'].includes(step.type)){
    if(step.type==='purchase'&&!state.businesses.includes(step.at)){
      if(state.money<1000){message('YOU NEED $1,000 TO BUY THIS BUSINESS');return}
      state.money-=1000;state.businesses.push(step.at);message('BUSINESS PURCHASED • +PASSIVE INCOME',3.4);
    }
    missionStepAdvance();return;
  }
  // Prefer nearby vehicle entry over garage menu when both are in range.
  const near=nearestCar(7.0);
  if(!near&&distance(state.playerPos,SITE.garage)<5.4){openGarage();return}
  if(near){state.inCar=near;state.inCar.speed=0;state.playerPos={x:near.x,z:near.z};player.enabled=false;camHeading=near.yaw;message(near.kind+' ENTERED',1.1);if(step?.type==='enterCar')missionStepAdvance();return}
  if(distance(state.playerPos,SITE.shop)<5){openShop();return}
  if(distance(state.playerPos,SITE.business)<5&&state.businesses.includes('business')){
    message('M.M.G. HOLDINGS • PROPERTY OWNED',2);return
  }
  const citizen=nearbyPerson();
  if(citizen){message(pick(['Keep your eyes open out here.','This city never sleeps.','M.M.G. is making moves.','Traffic is wild today.'],Math.floor(state.elapsed*3)))}
  else message('NOTHING TO INTERACT WITH',1.4);
}
function actionJump(){
  if(!state.active||state.paused)return;
  if(state.inCar){state.inCar.speed*=.72;return}
  if(state.moveY<=.005){state.vy=6.2;state.moveY=.008;beep(260,.06)}
}
function attack(){
  if(!state.active||state.paused)return;
  if(state.inCar){beep(320,.21,.04,'square');return}
  const step=currentStep();
  if(step?.type==='fight'){
    const available=rivals.filter(e=>!e.down&&distance(state.playerPos,e)<6);
    if(available.length){const rival=available[0];rival.down=true;rival.model.root.enabled=false;state.combatRemaining--;
      message('RIVAL DEFEATED • '+state.combatRemaining+' REMAINING',1.5);beep(145,.15);
      if(state.combatRemaining<=0)missionStepAdvance();return;
    }
    message('GET CLOSER TO A RIVAL',1.4);return;
  }
  const n=nearbyPerson(2.5);
  if(n){n.stunned=5;n.fled=8;increaseWanted(1);message('ASSAULT REPORTED • POLICE ALERT',2.7);beep(140,.17)}
  else{beep(245,.055);message('MELEE ATTACK',.8)}
}
const DEALERSHIP=[
  {id:'STREET COUPE',type:'COUPE',price:4000,color:'blue'},
  {id:'MIDNIGHT MUSCLE',type:'MUSCLE',price:5500,color:'black'},
  {id:'GOLD EDITION',type:'SPORT',price:9000,color:'gold'},
  {id:'EXECUTIVE SUV',type:'SUV',price:6500,color:'white'}
];
function clearOwnedCars(){
  for(let i=cars.length-1;i>=0;i--){if(cars[i].owned){cars[i].root.destroy();cars.splice(i,1)}}
}
function spawnOwnedCars(){
  clearOwnedCars();
  for(const key of state.ownedVehicles){
    const c=DEALERSHIP.find(v=>v.id===key);if(!c)continue;
    const i=state.ownedVehicles.indexOf(key);
    const car=createCar(8+i*5,84,c.type,c.color,'OWNED '+c.id,true);
    car.owned=true;
  }
}
function openGarage(){
  state.paused=true;
  const rows=DEALERSHIP.map(c=>`<button class="row-button" data-vehicle="${c.id}" ${state.ownedVehicles.includes(c.id)?'disabled':''}>${c.id} — $${c.price.toLocaleString('en-US')}<small>${state.ownedVehicles.includes(c.id)?'OWNED AND PARKED OUTSIDE':c.type+' • Purchase and add it to your garage'}</small></button>`).join('');
  dialog('MARLEY MOTORS • VEHICLE DEALERSHIP',`<p>M.M.G.'s first official vehicle dealership. Buy original cars with mission earnings. Purchased vehicles are saved.</p>${rows}`);
}
function buyVehicle(key){
  const c=DEALERSHIP.find(v=>v.id===key);if(!c||state.ownedVehicles.includes(key))return;
  if(state.money<c.price){message('NOT ENOUGH CASH FOR '+key,2);return}
  state.money-=c.price;state.ownedVehicles.push(key);
  spawnOwnedCars();saveGame();closeDialog();message(key+' PURCHASED • GARAGE UPDATED',3);
}
function openShop(){
  state.paused=true;
  dialog('EASTSIDE MARKET',`<p>Welcome to Eastside Market.</p><button class="row-button" data-shop="food">HEALTH KIT • $80<small>Restore 50 health</small></button><button class="row-button" data-shop="armor">BODY ARMOR • $160<small>Restore full health for this prototype</small></button><button class="row-button" data-shop="repair">VEHICLE REPAIR • $300<small>Repair the car you last drove</small></button>`);
}
function shopBuy(item){
  const prices={food:80,armor:160,repair:300},cost=prices[item];if(!cost)return;
  if(state.money<cost){message('NOT ENOUGH CASH',1.6);return}
  state.money-=cost;
  if(item==='food')heal(50);if(item==='armor')heal(100);
  if(item==='repair')for(const c of cars)if(c.damage>0)c.damage=0;
  saveGame();closeDialog();message('PURCHASE COMPLETE −$'+cost,2.2)
}

function readInputs(){
  let pad=null;try{pad=[...(navigator.getGamepads?.()||[])].find(v=>v?.connected)}catch{}
  const dead=n=>Math.abs(n||0)<.16?0:n;
  const b=n=>!!pad?.buttons?.[n]?.pressed;
  const ax=n=>dead(pad?.axes?.[n]||0);
  const btn=(key,down,fn)=>{if(down&&!padLast[key])fn();padLast[key]=down};
  btn('use',b(2),interact);btn('jump',b(0),actionJump);btn('attack',b(1),attack);btn('pause',b(9),togglePause);
  const kx=(Number(held.has('KeyD')||held.has('ArrowRight'))-Number(held.has('KeyA')||held.has('ArrowLeft')));
  const kz=(Number(held.has('KeyW')||held.has('ArrowUp'))-Number(held.has('KeyS')||held.has('ArrowDown')));
  return {x:clamp(joy.x+kx+ax(0),-1,1),z:clamp(joy.z+kz-ax(1),-1,1),sprint:sprintHeld||held.has('ShiftLeft')||held.has('ShiftRight')||b(7),rightX:ax(2),rightY:ax(3)};
}
function movePlayer(dt,input){
  let {x,z}=input;const amount=Math.hypot(x,z);if(amount>1){x/=amount;z/=amount}
  const forward=camHeading*rad,side=forward-Math.PI/2; // Correct screen-left and screen-right movement
  const vx=Math.sin(forward)*z+Math.sin(side)*x;
  const vz=Math.cos(forward)*z+Math.cos(side)*x;
  const speed=input.sprint?8.3:4.6;
  const nx=state.playerPos.x+vx*speed*dt,nz=state.playerPos.z+vz*speed*dt;
  // A previously overlapping car must never immobilize the player.
  const canMove=(px,pz)=>{
    if(!navigable(px,pz))return false;
    for(const car of cars){
      const a=car.yaw*rad,scale=carTypes[car.kind]?.scale||1;
      const overlap=(x,z)=>{
        const dx=x-car.x,dz=z-car.z;
        return Math.abs(dx*Math.cos(a)-dz*Math.sin(a))<1.1*scale+.3 &&
               Math.abs(dx*Math.sin(a)+dz*Math.cos(a))<2.15*scale+.3;
      };
      if(!overlap(px,pz))continue;
      if(!overlap(state.playerPos.x,state.playerPos.z))return false;
      const oldDist=Math.hypot(state.playerPos.x-car.x,state.playerPos.z-car.z);
      const newDist=Math.hypot(px-car.x,pz-car.z);
      if(newDist+.005<oldDist)return false;
    }
    return true;
  };
  if(canMove(nx,state.playerPos.z))state.playerPos.x=nx;
  if(canMove(state.playerPos.x,nz))state.playerPos.z=nz;
  if(amount>.13){
    const target=Math.atan2(vx,vz)/rad;
    state.yaw+=deltaAngle(target,state.yaw)*Math.min(1,dt*11);
  }
  if(state.moveY>0){state.vy-=18*dt;state.moveY+=state.vy*dt;if(state.moveY<0){state.moveY=0;state.vy=0}}
  player.setPosition(state.playerPos.x,state.moveY,state.playerPos.z);
  player.setEulerAngles(0,state.yaw,0);
  const motion=amount>.13?Math.sin(state.elapsed*(input.sprint?13:9))*(input.sprint?28:18):0;
  const l=playerMesh.limbs;l.leftArm.setLocalEulerAngles(motion,0,0);
  l.rightArm.setLocalEulerAngles(-motion,0,0);
  l.leftLeg.setLocalEulerAngles(-motion*.9,0,0);
  l.rightLeg.setLocalEulerAngles(motion*.9,0,0);
}
function moveCar(dt,input){
  const v=state.inCar;if(!v)return;
  const stats=carTypes[v.kind];
  const brake=held.has('Space')||state.actionDown;
  const throttle=(sprintHeld && input.z<.15)?1:input.z;
  const accel=(throttle>=0?stats.accel:stats.accel*.68);
  v.speed+=throttle*accel*dt;
  v.speed*=Math.pow(stats.drag,dt*60);
  if(brake)v.speed*=Math.pow(.80,dt*30);
  v.speed=clamp(v.speed,-stats.max*.4,stats.max*(1-v.damage*.12));
  if(Math.abs(v.speed)<.15&&Math.abs(throttle)<.1)v.speed=0;
  v.yaw-=input.x*stats.turn*dt*clamp(Math.abs(v.speed)/6,0,1.5)*(v.speed>=0?1:-1); // Correct reversed steering
  const heading=v.yaw*rad;
  const nextX=v.x+Math.sin(heading)*v.speed*dt,nextZ=v.z+Math.cos(heading)*v.speed*dt;
  const vehicleBlocked=cars.some(other=>other!==v&&distance({x:nextX,z:nextZ},other)<(1.7*stats.scale+1.7*carTypes[other.kind].scale));
  if(navigable(nextX,nextZ,1.55*stats.scale)&&!vehicleBlocked){
    v.x=nextX;v.z=nextZ;
  }else if(Math.abs(v.speed)>3){
    v.damage=clamp(v.damage+.09,0,3);
    state.health-=Math.min(18,Math.abs(v.speed)*.33);v.speed*=-.18;
    if(state.elapsed-state.damageTimer>1.8){message('VEHICLE COLLISION • SLOW DOWN',1.5);state.damageTimer=state.elapsed;beep(155,.22)}
  }else v.speed=0;
  v.root.setPosition(v.x,0,v.z);v.root.setEulerAngles(0,v.yaw,0);
  for(const wheel of v.wheels)wheel.rotateLocal(0,dt*v.speed*30,0);
  state.playerPos={x:v.x,z:v.z};

}
function updateTraffic(dt){
  // AI traffic yields to the player and neighboring cars instead of ghosting through them.
  // Lightweight overlap avoidance (not a full rigid-body physics simulation).
  for(const v of cars){
    if(!v.ai||v.police||!v.path)continue;
    v.root.enabled=!(state.active&&distance(v,state.playerPos)>145);
    const a=v.path[v.seg],b=v.path[(v.seg+1)%v.path.length];
    const length=Math.max(1,distance(a,b));
    const advance=dt*v.cruise/length;
    let nextSeg=v.seg,nextT=v.t+advance;
    if(nextT>=1){nextT-=1;nextSeg=(nextSeg+1)%v.path.length}
    const start=v.path[nextSeg],end=v.path[(nextSeg+1)%v.path.length];
    const nx=lerp(start.x,end.x,nextT),nz=lerp(start.z,end.z,nextT);
    const blockedByPlayer=!!(state.inCar&&state.inCar!==v&&distance({x:nx,z:nz},state.inCar)<(2.2*carTypes[v.kind].scale+2.2*carTypes[state.inCar.kind].scale));
    const blockedByCars=cars.some(other=>other!==v&&distance({x:nx,z:nz},other)<(1.8*carTypes[v.kind].scale+1.8*carTypes[other.kind].scale));
    if(blockedByPlayer||blockedByCars)continue;
    v.seg=nextSeg;v.t=nextT;v.x=nx;v.z=nz;
    v.yaw=Math.atan2(end.x-start.x,end.z-start.z)/rad;
    v.root.setPosition(v.x,0,v.z);v.root.setEulerAngles(0,v.yaw,0);
  }
}

let cullClock=0;
function updateVisibility(dt){
  cullClock+=dt;if(cullClock<.75)return;cullClock=0;
  const p=state.inCar||state.playerPos;
  const range=prefs.quality==='high'?250:prefs.quality==='balanced'?168:113;
  const rangeSq=range*range;
  for(const b of buildingGroups){
    const dx=b.x-p.x,dz=b.z-p.z;b.root.enabled=!b.replacedByGLB && dx*dx+dz*dz<rangeSq;
  }
  for(const t of trees){const v=t.getPosition();const dx=v.x-p.x,dz=v.z-p.z;t.enabled=dx*dx+dz*dz<rangeSq}
  for(const l of lamps){const v=l.getPosition();const dx=v.x-p.x,dz=v.z-p.z;l.enabled=dx*dx+dz*dz<rangeSq}
}
function updatePeople(dt){
  for(let i=0;i<people.length;i++){
    const npc=people[i];const p=npc.model.root;
    if(npc.stunned>0){npc.stunned-=dt;if(npc.stunned>0)continue}
    npc.angle+=npc.speed*dt*(npc.fled>0?4:1);
    if(npc.fled>0)npc.fled-=dt;
    const x=npc.cx+Math.cos(npc.angle)*14.2,z=npc.cz+Math.sin(npc.angle)*14.2;
    p.setPosition(x,0,z);p.setEulerAngles(0,(-npc.angle/rad+90)%360,0);
    const visible=!state.active||distance({x,z},state.playerPos)<85;
    p.enabled=visible;
    if(visible){
      const n=Math.sin(state.elapsed*7+i)*15;
      npc.model.limbs.leftArm.setLocalEulerAngles(n,0,0);
      npc.model.limbs.rightArm.setLocalEulerAngles(-n,0,0);
      npc.model.limbs.leftLeg.setLocalEulerAngles(-n,0,0);
      npc.model.limbs.rightLeg.setLocalEulerAngles(n,0,0);
    }
  }
  for(const e of rivals)e.model.root.enabled=!e.down&&(!state.active||distance(e,state.playerPos)<95);
}
function updatePolice(dt){
  if(!state.wanted){for(const p of police){p.root.enabled=false}return}
  let visibleCount=0;
  for(let i=0;i<police.length;i++){
    const v=police[i];v.root.enabled=i<Math.min(police.length,state.wanted);
    if(!v.root.enabled)continue;
    const target=state.inCar||state.playerPos;
    const d=distance(v,target);
    if(d>120){v.x=target.x+Math.cos(i*2.1+1)*55;v.z=target.z+Math.sin(i*2.1+1)*55;}
    const desired=Math.atan2(target.x-v.x,target.z-v.z)/rad;
    v.yaw+=deltaAngle(desired,v.yaw)*Math.min(1,dt*2);
    const stride=Math.min(14+state.wanted*2,25)*dt;
    const nx=v.x+Math.sin(v.yaw*rad)*stride,nz=v.z+Math.cos(v.yaw*rad)*stride;
    if(navigable(nx,nz,1.4)){v.x=nx;v.z=nz}
    v.root.setPosition(v.x,0,v.z);v.root.setEulerAngles(0,v.yaw,0);
    if(d<28)visibleCount++;
    if(d<3&&state.elapsed-state.damageTimer>1.7){
      state.damageTimer=state.elapsed;state.health-=state.inCar?8:18;message('POLICE PURSUIT • AVOID CAPTURE',1.5);beep(240,.21);
    }
  }
  if(visibleCount===0){state.heatCooldown-=dt;if(state.heatCooldown<=0){state.wanted=Math.max(0,state.wanted-1);state.heatCooldown=14;if(!state.wanted)message('WANTED LEVEL CLEARED',2.4)}}
  else state.heatCooldown=Math.max(state.heatCooldown,18);
}
function updateHealth(){
  if(state.health>0)return;
  state.health=100;state.wanted=0;state.heatCooldown=0;
  if(state.inCar){state.inCar.speed=0;state.inCar=null}
  player.enabled=true;state.playerPos={...SITE.safehouse};player.setPosition(0,0,0);
  const lost=Math.min(state.money,500);state.money-=lost;
  message('HOSPITAL RELEASE • MEDICAL FEES $'+lost,5);saveGame();
}
function updateMissions(dt){
  // Business income continues in free roam and after the main campaign ends.
  if(state.businesses.length>0){
    state.ticks+=dt;
    if(state.ticks>=150){state.ticks=0;state.money+=125*state.businesses.length;message('M.M.G. BUSINESS REVENUE • +$'+(125*state.businesses.length),3);saveGame()}
  }
  const step=currentStep();if(!step||state.freeRoam)return;
  if(state.nextMissionDelay>0){state.nextMissionDelay-=dt;return}
  const point=SITE[step.at];const position=state.inCar||state.playerPos;
  if(step.type==='reach'&&distance(position,point)<5)missionStepAdvance();
  if(step.type==='drive'&&state.inCar&&distance(position,point)<8)missionStepAdvance();
  if(step.type==='deliverDrive'&&state.inCar&&distance(position,point)<8)missionStepAdvance();
  if(step.type==='race'){
    state.raceTimer+=dt;
    if(state.inCar&&distance(position,point)<8)missionStepAdvance();
  }
  if(step.type==='escape'&&state.wanted===0)missionStepAdvance();
  if(state.missionTimer>0)state.missionTimer-=dt;
}
function updateDaylight(dt){
  if(!state.active)return;
  state.time=(state.time+dt/150)%24;
  const angle=((state.time-6)/24)*Math.PI*2;
  const daylight=clamp(Math.sin(angle)*1.8+.28,.14,1);
  sun.light.intensity=.28+daylight*1.6;
  sun.setEulerAngles(55+Math.cos(angle)*16,state.time*15,0);
  app.scene.ambientLight=new pc.Color(.17+daylight*.27,.18+daylight*.29,.25+daylight*.26);
  camera.camera.clearColor=new pc.Color(.07+daylight*.40,.10+daylight*.43,.19+daylight*.44);
}
function updateCamera(dt,lookX=0,lookY=0){
  if(!state.active){
    const a=state.elapsed*.023;
    camera.setPosition(118+Math.sin(a)*32,72,126+Math.cos(a)*36);
    camera.lookAt(0,14,0);return;
  }
  if(state.inCar){
    const target=state.inCar.yaw; // Follow behind the vehicle
    if(Math.abs(lookX)<.01)camHeading+=deltaAngle(target,camHeading)*Math.min(1,dt*1.1);
  }
  camHeading+=lookX*95*dt;
  camPitch=clamp(camPitch-lookY*58*dt,-10,58);
  const position=state.inCar||state.playerPos;
  const viewAngle=camHeading*rad;
  const range=state.inCar?12.5:7.2;
  const elevation=state.inCar?5.2:3.1;
  const aimX=position.x+Math.sin(viewAngle)*1.5,aimZ=position.z+Math.cos(viewAngle)*1.5;
  const targetX=position.x-Math.sin(viewAngle)*range;
  const targetZ=position.z-Math.cos(viewAngle)*range;
  const targetY=elevation+Math.sin(camPitch*rad)*range*.62+(state.inCar?0:state.moveY);
  const old=camera.getPosition();const easing=1-Math.exp(-5.5*dt); // Smooth across frame rates
  camera.setPosition(lerp(old.x,targetX,easing),lerp(old.y,targetY,easing),lerp(old.z,targetZ,easing));
  camera.lookAt(aimX,1.55+(state.inCar?0:state.moveY),aimZ);
}
function updateHUD(){
  if(!state.active)return;
  setText('district',region(state.playerPos.x,state.playerPos.z));
  setText('area',region(state.playerPos.x,state.playerPos.z));
  setText('cash',Math.max(0,Math.round(state.money)).toLocaleString('en-US'));
  $('health-bar').style.width=clamp(state.health,0,100)+'%';
  setText('stars','★'.repeat(state.wanted)+'☆'.repeat(5-state.wanted));
  const hour=Math.floor(state.time)%24,minute=Math.floor((state.time-hour)*60);
  setText('clock',String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0'));
  const mission=MISSIONS[state.mission],step=currentStep();
  setText('mission-number',mission?String(state.mission+1).padStart(2,'0')+' / 12':'DONE');
  setText('mission-name',state.freeRoam?'FREE ROAM':mission?.name||'CAMPAIGN COMPLETE');
  setText('mission-objective',step?.text||(state.freeRoam?'Explore the city, drive, shop and visit M.M.G. properties.':'You completed the 12-mission campaign!'));
  if(step?.type==='enterCar')mark();
  if(step&&step.type!=='escape')setText('objective-distance',Math.round(distance(state.inCar||state.playerPos,missionPoint(step)))+' METERS • GOLD WAYPOINT');
  else setText('objective-distance',step?.type==='escape'?'LOSE YOUR WANTED STARS':'EMPIRE CITY • OPEN WORLD');
  $('speed-display').classList.toggle('hidden',!state.inCar);
  if(state.inCar)setText('speed-display',Math.round(Math.abs(state.inCar.speed)*2.23694)+' MPH');
  setText('weapon-display',state.inCar?state.inCar.kind+' • DRIVING':'MELEE • UNARMED');
  setText('jump-btn',state.inCar?'BRAKE':'JUMP');setText('run-btn',state.inCar?'GAS':'RUN');
  setText('use-btn',state.inCar?'EXIT':'USE');setText('attack-btn',state.inCar?'HORN':'HIT');
  const nearby=nearestCar();
  setText('interaction-hint',state.inCar?'DRIVE • BRAKE • EXIT VEHICLE':distance(state.playerPos,SITE.garage)<5.4?'PRESS USE • MARLEY MOTORS':nearby?'PRESS USE TO ENTER '+nearby.kind:distance(state.playerPos,SITE.shop)<5?'PRESS USE TO VISIT MARKET':'MOVE • SPRINT • JUMP • USE • HIT');
  if(toastExpires<state.elapsed)$('message').classList.add('hidden');
}
function drawMap(){
  const ctx=$('minimap').getContext('2d');if(!ctx)return;
  const w=220,h=220,s=1.1;const playerPosition=state.inCar||state.playerPos;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#162328';ctx.fillRect(0,0,w,h);
  ctx.save();ctx.translate(w/2,h/2);
  ctx.fillStyle='#192c37';ctx.fillRect(-w/2,-h/2,w,h);
  ctx.lineWidth=10*s;ctx.strokeStyle='#6e7882';
  for(const q of ROADS){
    const x=(q-playerPosition.x)*s,z=(q-playerPosition.z)*s;
    ctx.beginPath();ctx.moveTo(x,-500);ctx.lineTo(x,500);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-500,z);ctx.lineTo(500,z);ctx.stroke();
  }
  ctx.strokeStyle='#c5a05a';ctx.lineWidth=.8;ctx.setLineDash([5,7]);
  for(const q of ROADS){const x=(q-playerPosition.x)*s,z=(q-playerPosition.z)*s;ctx.beginPath();ctx.moveTo(x,-500);ctx.lineTo(x,500);ctx.stroke();ctx.beginPath();ctx.moveTo(-500,z);ctx.lineTo(500,z);ctx.stroke()}
  ctx.setLineDash([]);
  const step=currentStep();if(step?.at){const dest=missionPoint(step);const x=(dest.x-playerPosition.x)*s,z=(dest.z-playerPosition.z)*s;ctx.fillStyle='#efbd4c';ctx.beginPath();ctx.arc(x,z,6,0,Math.PI*2);ctx.fill()}
  for(const e of police){if(!state.wanted)break;const x=(e.x-playerPosition.x)*s,z=(e.z-playerPosition.z)*s;ctx.fillStyle='#e45e60';ctx.fillRect(x-3,z-3,6,6)}
  ctx.fillStyle='#9dc3f4';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();
  ctx.restore();
  ctx.strokeStyle='#c5a05a';ctx.lineWidth=3;ctx.strokeRect(1,1,w-2,h-2);
}

function beep(freq=360,duration=.08,volume=.042,type='triangle'){
  try{if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;audio=new A()}
    if(audio.state==='suspended')audio.resume();
    const oscillator=audio.createOscillator(),gain=audio.createGain();
    oscillator.type=type;oscillator.frequency.setValueAtTime(freq,audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(60,freq*.8),audio.currentTime+duration);
    gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
    oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+duration);
  }catch{}
}
function soundAction(){beep(430,.06)}
let musicStep=0,musicElapsed=0;
function updateMusic(dt){
  if(!state.radio||!state.active||state.paused)return;
  musicElapsed+=dt;const interval=60/90/4;
  if(musicElapsed>=interval){musicElapsed-=interval;
    if(musicStep%4===0)beep(68,.16,.035,'sine');
    if(musicStep%8===4)beep(180,.10,.022,'triangle');
    if(musicStep%2===0)beep(820,.025,.008,'square');
    if(musicStep%16===2||musicStep%16===10)beep(105,.23,.023,'sawtooth');
    musicStep=(musicStep+1)%16;
  }
}

function dialog(title,html){
  setText('dialog-title',title);
  $('dialog-body').innerHTML=html;
  $('dialog').classList.remove('hidden');
}
function closeDialog(){
  $('dialog').classList.add('hidden');
  if(state.active)state.paused=false;
}
function mainMenu(){
  state.active=false;state.paused=false;state.inCar=null;state.radio=false;
  $('main-menu').classList.remove('hidden');$('hud').classList.add('hidden');
  $('dialog').classList.add('hidden');$('grain').style.display='block';
  $('continue-game').disabled=!loadGame();
}
function beginGame(mode='new'){
  const saved=mode==='continue'?loadGame():null;
  if(saved){
    state.mission=clamp(Math.floor(saved.mission||0),0,MISSIONS.length);state.step=clamp(Math.floor(saved.step||0),0,8);
    state.money=Math.max(0,Math.floor(saved.money||0));state.health=clamp(saved.health||100,1,100);
    state.time=saved.time||16.5;state.character=characterStyles[saved.character]?saved.character:'MARLEY';
    state.businesses=Array.isArray(saved.businesses)?saved.businesses:[];
    state.ownedVehicles=Array.isArray(saved.ownedVehicles)?saved.ownedVehicles:[];
    state.playerPos=saved.playerPos&&navigable(saved.playerPos.x,saved.playerPos.z)&&outsideVehicle(saved.playerPos.x,saved.playerPos.z)?saved.playerPos:{...SITE.start};
  }else{
    state.mission=0;state.step=0;state.money=2500;state.health=100;state.businesses=[];state.ownedVehicles=[];
    state.playerPos={...SITE.start};state.time=16.5;
  }
  state.freeRoam=mode==='free';state.active=true;state.paused=false;
  state.inCar=null;state.wanted=0;state.heat=0;state.heatCooldown=0;
  state.yaw=0;state.moveY=0;state.vy=0;state.nextMissionDelay=0;
  state.ticks=0;state.raceTimer=0;cullClock=.75;resetRivals();
  const old=player;playerMesh=createHuman('Player',0,0,state.character,1);player=playerMesh.root;
  old.destroy();player.setPosition(state.playerPos.x,0,state.playerPos.z);
  cars.forEach(car=>{if(car.ai||car.owned)return;car.speed=0;car.damage=0;car.yaw=0;car.x=car.initialX;car.z=car.initialZ;car.root.setPosition(car.x,0,car.z);car.root.setEulerAngles(0,0,0)});
  spawnOwnedCars();
  $('main-menu').classList.add('hidden');$('dialog').classList.add('hidden');$('hud').classList.remove('hidden');
  $('grain').style.display='none';camHeading=0;camPitch=16;
  state.radio=!!prefs.music;setText('radio-btn','♫ RADIO: '+(state.radio?'ON':'OFF'));
  mark();updateHUD();drawMap();
  message(mode==='continue'?'WELCOME BACK TO EMPIRE CITY':mode==='free'?'FREE ROAM • EXPLORE THE CITY':'WELCOME TO EMPIRE CITY',3);
  if(mode==='new')saveGame();
}
function togglePause(){
  if(!state.active)return;
  if(state.paused){closeDialog();return}
  state.paused=true;saveGame();
  dialog('PAUSED — EMPIRE CITY',`<p>Story progress is saved automatically when objectives are completed.</p>
  <button class="row-button" data-action="resume">RESUME THE CITY</button>
  <button class="row-button" data-action="map">WORLD MAP & STORY MISSIONS</button>
  <button class="row-button" data-action="settings">GRAPHICS & AUDIO SETTINGS</button>
  <button class="row-button" data-action="menu">RETURN TO MAIN MENU</button>`);
}
function showSettings(){
  const wasActive=state.active;if(wasActive)state.paused=true;
  dialog('GRAPHICS & SOUND',`<p>Recommended setting for Galaxy Tab A9: <b>Mobile / Performance.</b> Graphics change immediately.</p>
  <label>Graphics quality <select id="quality-choice"><option value="mobile">Mobile / Performance</option><option value="balanced">Balanced</option><option value="high">High / Desktop</option></select></label>
  <p><label><input id="music-choice" type="checkbox"> Enable original synthesized hip-hop radio</label></p>
  <p class="subtle">The graphics in this code-first prototype use procedural geometry and textures. For realistic people and vehicles, production-quality optimized GLB models are still required.</p>`);
  $('quality-choice').value=prefs.quality||'mobile';$('music-choice').checked=!!prefs.music;
  $('quality-choice').onchange=e=>{prefs.quality=e.target.value;savePrefs();applyQuality()};
  $('music-choice').onchange=e=>{prefs.music=e.target.checked;state.radio=prefs.music;savePrefs();setText('radio-btn','♫ RADIO: '+(state.radio?'ON':'OFF'))};
}
function showControls(){
  if(state.active)state.paused=true;
  dialog('CONTROLS',`<p><b>Samsung tablet:</b> Drag the left joystick to move. Swipe on the game view to rotate the camera. RUN / GAS moves faster; JUMP / BRAKE stops; USE enters cars and interacts; HIT attacks.</p>
  <p><b>Keyboard:</b> WASD or arrow keys = move / steer. SHIFT = run. SPACE = jump / brake. E = enter or interact. F = melee attack. P or ESC = pause.</p>
  <p><b>Bluetooth PlayStation or Xbox-style controller:</b> Left stick = move, right stick = camera, A / Cross = jump, X / Square = interact, B / Circle = hit, right trigger = sprint, Start = pause. Browser mappings may vary.</p>
  <p>Gold markers show campaign objectives. Earn money from missions and your purchased business. Watch out for traffic and police.</p>`);
}
function showCharacters(){
  if(state.active)state.paused=true;
  dialog('CHOOSE YOUR CHARACTER',`<p>Select an original Empire City hero. Current selection: <b>${state.character}</b></p>
  <button class="row-button" data-character="MARLEY">MARLEY — THE AMBITIOUS LEADER<small>Short dreadlocks, tailored dark streetwear and gold details.</small></button>
  <button class="row-button" data-character="ACE">ACE — THE STRATEGIST<small>Blue-black tailored look and a smooth fade.</small></button>
  <button class="row-button" data-character="NOVA">NOVA — THE HUSTLER<small>Modern burgundy streetwear and tied-back hair.</small></button>`);
}
function drawWorldMap(){
  const canvas=$('citymap');if(!canvas)return;
  const g=canvas.getContext('2d');const w=400,h=330;
  g.fillStyle='#1c2a31';g.fillRect(0,0,w,h);
  const x=v=>w/2+v*1.04,z=v=>h/2+v*1.04;
  g.fillStyle='#243b3a';g.fillRect(0,0,w*.42,h);
  g.fillStyle='#25313a';g.fillRect(w*.42,0,w*.35,h);
  g.fillStyle='#263b45';g.fillRect(w*.77,0,w*.23,h);
  g.strokeStyle='#9ba2a4';g.lineWidth=12;
  for(const road of ROADS){g.beginPath();g.moveTo(x(road),0);g.lineTo(x(road),h);g.stroke();g.beginPath();g.moveTo(0,z(road));g.lineTo(w,z(road));g.stroke()}
  g.setLineDash([3,5]);g.strokeStyle='#d7b878';g.lineWidth=1;
  for(const road of ROADS){g.beginPath();g.moveTo(x(road),0);g.lineTo(x(road),h);g.stroke();g.beginPath();g.moveTo(0,z(road));g.lineTo(w,z(road));g.stroke()}g.setLineDash([]);
  g.font='bold 11px system-ui';g.fillStyle='#e9dbb7';
  const zones=[['WESTSIDE',-107,20],['UPTOWN',-88,-108],['DOWNTOWN',0,0],['FINANCIAL',57,-95],['WATERFRONT',109,30]];
  for(const [name,xx,zz]of zones)g.fillText(name,x(xx)-21,z(zz));
  for(const [name,key]of [['GARAGE','garage'],['M.M.G.','studio'],['MARKET','shop'],['BUSINESS','business']]){
    const p=SITE[key];g.fillStyle='#83ba9d';g.beginPath();g.arc(x(p.x),z(p.z),4,0,Math.PI*2);g.fill();g.fillStyle='#e9e6d9';g.font='8px system-ui';g.fillText(name,x(p.x)+6,z(p.z)-5);
  }
  const objectiveStep=currentStep();
  if(objectiveStep?.at){const p=missionPoint(objectiveStep);g.fillStyle='#e9ab44';g.beginPath();g.arc(x(p.x),z(p.z),7,0,Math.PI*2);g.fill()}
  const me=state.inCar||state.playerPos;g.fillStyle='#9fd1ff';g.beginPath();g.arc(x(me.x),z(me.z),6,0,Math.PI*2);g.fill();
  g.strokeStyle='#e0ad5d';g.lineWidth=3;g.strokeRect(1,1,w-2,h-2);
}
function showMapMenu(){
  if(state.active)state.paused=true;
  let missionButtons='';
  MISSIONS.forEach((m,i)=>{
    const available=i<=state.mission;
    missionButtons+=`<button class="row-button" data-mission="${i}" ${available?'':'disabled'}>${String(i+1).padStart(2,'0')} — ${m.name}<small>${available?'Replay this chapter from the beginning':'LOCKED • Complete previous missions'} • Reward $${m.reward.toLocaleString('en-US')}</small></button>`;
  });
  dialog('CITY MAP & STORY CAMPAIGN',`<p><b>Districts:</b> Downtown, Uptown, Westside, Waterfront. Gold = objective; blue = you.</p>
  <canvas id="citymap" width="400" height="330" style="width:100%;max-width:400px;display:block;border:1px solid #b08b52;margin-bottom:14px"></canvas>
  <p><b>Owned businesses:</b> ${state.businesses.length} • <b>Current wanted level:</b> ${state.wanted} / 5</p>${missionButtons}`);
  drawWorldMap();
}
function missionReplay(index){
  if(index>state.mission)return;
  state.freeRoam=false;state.mission=index;state.step=0;state.nextMissionDelay=0;
  state.wanted=0;state.heatCooldown=0;resetRivals();saveGame();mark();closeDialog();
  message('STARTING MISSION '+(index+1)+': '+MISSIONS[index].name,4)
}
function applyQuality(){
  if(!device||!app)return;
  const ratio=prefs.quality==='high'?Math.min(2,window.devicePixelRatio||1):prefs.quality==='balanced'?Math.min(1.5,window.devicePixelRatio||1):1;
  device.maxPixelRatio=ratio;
  if(sun?.light)sun.light.castShadows=prefs.quality==='high';
  app.resizeCanvas();
}
function bindUI(){
  $('new-game').onclick=()=>beginGame('new');
  $('continue-game').onclick=()=>beginGame('continue');
  $('free-roam').onclick=()=>beginGame('free');
  $('characters').onclick=showCharacters;$('settings').onclick=showSettings;$('controls').onclick=showControls;
  $('pause').onclick=togglePause;$('dialog-close').onclick=closeDialog;
  $('map-btn').onclick=showMapMenu;
  $('radio-btn').onclick=()=>{state.radio=!state.radio;prefs.music=state.radio;savePrefs();setText('radio-btn','♫ RADIO: '+(state.radio?'ON':'OFF'))};
  $('use-btn').onpointerdown=e=>{e.preventDefault();interact()};
  $('jump-btn').onpointerdown=e=>{e.preventDefault();state.actionDown=true;actionJump()};
  const releaseBrake=()=>state.actionDown=false;
  $('jump-btn').addEventListener('pointerup',releaseBrake);$('jump-btn').addEventListener('pointercancel',releaseBrake);
  $('attack-btn').onpointerdown=e=>{e.preventDefault();attack()};
  const sprint=$('run-btn');
  sprint.onpointerdown=e=>{e.preventDefault();sprintHeld=true;sprint.classList.add('pressed');sprint.setPointerCapture(e.pointerId)};
  const releaseSprint=()=>{sprintHeld=false;sprint.classList.remove('pressed')};
  sprint.addEventListener('pointerup',releaseSprint);sprint.addEventListener('pointercancel',releaseSprint);
  const zone=$('stick-zone'),dot=$('stick-dot');
  const setStick=e=>{
    const r=zone.getBoundingClientRect();let dx=(e.clientX-r.left-r.width/2)/49,dy=(e.clientY-r.top-r.height/2)/49;
    const length=Math.hypot(dx,dy);if(length>1){dx/=length;dy/=length}
    joy.x=dx;joy.z=-dy;dot.style.transform=`translate(${dx*34}px,${dy*34}px)`;
  };
  zone.onpointerdown=e=>{e.preventDefault();if(joy.id!==null)return;joy.id=e.pointerId;zone.setPointerCapture(e.pointerId);setStick(e)};
  zone.onpointermove=e=>{if(e.pointerId===joy.id)setStick(e)};
  const stopStick=e=>{if(e.pointerId!==joy.id)return;joy.id=null;joy.x=0;joy.z=0;dot.style.transform='translate(0px,0px)'};
  zone.onpointerup=stopStick;zone.onpointercancel=stopStick;
  // Touch camera look anywhere on the 3D canvas without interfering with the joystick/buttons.
  const canvas=$('application');
  canvas.onpointerdown=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;look.id=e.pointerId;look.lastX=e.clientX;look.lastY=e.clientY;canvas.setPointerCapture(e.pointerId)};
  canvas.onpointermove=e=>{if(e.pointerId!==look.id||!state.active||state.paused)return;
    const dx=clamp(e.clientX-look.lastX,-55,55),dy=clamp(e.clientY-look.lastY,-40,40);
    camHeading+=dx*.38;camPitch=clamp(camPitch+dy*.25,-8,58);look.lastX=e.clientX;look.lastY=e.clientY;
  };
  canvas.onpointerup=()=>{look.id=null};canvas.onpointercancel=()=>{look.id=null};
  document.addEventListener('keydown',e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
    held.add(e.code);if(e.repeat)return;
    if(e.code==='KeyE')interact();if(e.code==='KeyF')attack();if(e.code==='Space')actionJump();
    if(e.code==='Escape'||e.code==='KeyP')togglePause();
  });
  document.addEventListener('keyup',e=>held.delete(e.code));
  window.addEventListener('blur',()=>{held.clear();sprintHeld=false;state.actionDown=false;joy.x=joy.z=0});
  $('dialog-body').addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button||button.disabled)return;
    if(button.dataset.action==='resume')closeDialog();
    if(button.dataset.action==='menu'){saveGame();mainMenu()}
    if(button.dataset.action==='settings')showSettings();
    if(button.dataset.action==='map')showMapMenu();
    if(button.dataset.shop)shopBuy(button.dataset.shop);
    if(button.dataset.vehicle)buyVehicle(button.dataset.vehicle);
    if(button.dataset.mission!==undefined)missionReplay(Number(button.dataset.mission));
    if(button.dataset.character){
      state.character=button.dataset.character;
      if(state.active){const old=player;playerMesh=createHuman('Player',0,0,state.character,1);player=playerMesh.root;old.destroy();player.setPosition(state.playerPos.x,0,state.playerPos.z)}
      saveGame();showCharacters();message('CHARACTER SELECTED: '+state.character,2);
    }
  });
}
async function init(){
  const canvas=$('application');
  device=await pc.createGraphicsDevice(canvas,{deviceTypes:[pc.DEVICETYPE_WEBGL2],antialias:false,powerPreference:'high-performance'});
  const opts=new pc.AppOptions();opts.graphicsDevice=device;
  opts.componentSystems=[pc.RenderComponentSystem,pc.CameraComponentSystem,pc.LightComponentSystem];
  app=new pc.AppBase(canvas);app.init(opts);
  app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.scene.ambientLight=new pc.Color(.38,.40,.49);
  sun=new pc.Entity('Sun');sun.addComponent('light',{type:'directional',intensity:1.7,color:new pc.Color(1,.89,.72),castShadows:false});
  sun.setEulerAngles(55,25,0);app.root.addChild(sun);
  camera=new pc.Entity('Third-person camera');camera.addComponent('camera',{clearColor:new pc.Color(.42,.49,.60),farClip:395,nearClip:.12,fov:65});app.root.addChild(camera);
  createCity();createPeopleAndCars();createObjective();bindUI();applyQuality();
  enableRealModels();
  window.addEventListener('resize',()=>app.resizeCanvas());
  app.start();
  app.on('update',rawDt=>{
    const dt=Math.min(.05,Math.max(0,rawDt||0));state.elapsed+=dt;
    if(state.active&&!state.paused){
      const input=readInputs();
      if(state.inCar)moveCar(dt,input);else movePlayer(dt,input);
      updateTraffic(dt);updatePeople(dt);updatePolice(dt);updateVisibility(dt);
      updateMissions(dt);updateHealth();updateDaylight(dt);updateCamera(dt,input.rightX,input.rightY);
      updateMusic(dt);
      uiTicks+=dt;if(uiTicks>=.18){uiTicks=0;updateHUD();drawMap()}
    }else if(!state.active){updateTraffic(dt);updateCamera(dt)}
  });
  camera.setPosition(120,75,124);camera.lookAt(0,12,0);
  $('loading').classList.add('hidden');mainMenu();
}
init().catch(showError);
