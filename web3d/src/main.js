import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const root=document.querySelector('#game');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9eb8c5);
scene.fog=new THREE.Fog(0x9eb8c5,38,105);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,125);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power',alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.15));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=false;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
root.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe4efff,0x59604c,1.55));
const sun=new THREE.DirectionalLight(0xffe6c4,2.0);sun.position.set(-25,38,18);sun.castShadow=false;scene.add(sun);
const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
const mats={grass:mat(0x667c61),road:mat(0x343b40,.96),side:mat(0xb7b6aa,.95),white:mat(0xe4e0d4),glass:mat(0x7394a1,.2),skin:mat(0xc8916e),shirt:mat(0x304f67),pants:mat(0x26323b),car:mat(0x315d67,.32),line:mat(0xd8d2b6)};
const boxGeo=new THREE.BoxGeometry(1,1,1);
function box(parent,name,x,y,z,sx,sy,sz,material){const m=new THREE.Mesh(boxGeo,material);m.name=name;m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),mats.grass);ground.rotation.x=-Math.PI/2;ground.position.y=-.09;scene.add(ground);
box(scene,'Road',0,-.015,0,9,.12,120,mats.road);
box(scene,'Sidewalk',-6,.01,0,3,.18,120,mats.side);box(scene,'Sidewalk',6,.01,0,3,.18,120,mats.side);
box(scene,'Cross street',0,-.005,0,120,.12,8,mats.road);
for(let z=-54;z<=54;z+=9){box(scene,'Road marking',0,.052,z, .12,.012,3.8,mats.line);}
const buildingColors=[0xb8b3a8,0x9daeb0,0xc3b9a7,0x8e9ba3,0xd0c8b7];
for(let i=0;i<13;i++){
 const z=-54+i*9;
 for(const side of [-1,1]){
  const h=7+(i*7+side*3)%10, w=6.5+(i%3)*.6;
  const x=side*(10+w/2);
  const facade=mat(buildingColors[(i+(side>0?1:0))%buildingColors.length],.92);
  box(scene,'Apartment building',x,h/2,z,w,h,7,facade);
  box(scene,'Ground floor stone plinth',x,.72,z-side*3.56,w,.85,.16,mat(0x777d7a,.95));
  box(scene,'Roof parapet',x,h+.28,z,w+.18,.48,7.18,mat(0x777f80,.92));
  box(scene,'Roof slab',x,h+.04,z,w+.12,.12,7.12,mat(0x555f60));
  const winMat=mat(0x344c56,.28),frameMat=mat(0xd0cec4,.75),balconyMat=mat(0x555d5b,.72);
  for(let row=1;row<Math.min(6,Math.floor(h/2));row++)for(let col=0;col<3;col++){
   const wx=x+(col-1)*1.9, wy=.95+row*1.38, wz=z-side*3.59;
   box(scene,'Window recess',wx,wy,wz,.98,.98,.11,mat(0x777d7b));
   box(scene,'Glazed window',wx,wy,wz-side*.075,.78,.76,.045,winMat);
   box(scene,'Window sill',wx,wy-.43,wz-side*.12,1.02,.09,.18,frameMat);
   box(scene,'Window lintel',wx,wy+.43,wz-side*.12,1.02,.08,.16,frameMat);
   box(scene,'Window mullion',wx,wy,wz-side*.15,.045,.78,.04,frameMat);
   if(row>1 && (col+i)%2===0){
    box(scene,'Balcony slab',wx,wy-.5,wz-side*.48,1.18,.09,.82,mat(0x777b77));
    for(let k=-2;k<=2;k++)box(scene,'Balcony railing',wx+k*.22,wy-.18,wz-side*.82,.035,.55,.035,balconyMat);
    box(scene,'Balcony top rail',wx,wy+.1,wz-side*.82,1.02,.045,.045,balconyMat);
   }
  }
  const shopX=x, shopZ=z-side*3.72;
  box(scene,'Shopfront glass',shopX,.95,shopZ,w*.72,1.45,.09,mat(0x35535b,.22));
  box(scene,'Shop door',shopX-side*w*.27,.9,shopZ-side*.07,.72,1.8,.12,mat(0x263c43,.3));
  box(scene,'Shop sign',shopX,1.95,shopZ-side*.16,w*.78,.32,.12,mat([0x9a684f,0x617b70,0x9a875e][i%3]));
  if(i%3===0)box(scene,'Shop awning',x,2.25,z-side*4.05,w*.82,.16,.72,mat(0x9b6552));
  if(i%2===0)box(scene,'AC outdoor unit',x+w*.34,h*.42,z-side*3.78,.52,.42,.3,mat(0x9da4a1));
 }
}
for(let i=0;i<22;i++){const x=(i%2?1:-1)*(8+Math.random()*22),z=-58+Math.random()*116;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.2,1.7,5),mat(0x66503d));trunk.position.set(x,.85,z);scene.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.05,0),mat(0x58785d));crown.position.set(x,2,z);scene.add(crown);}
const lampMat=mat(0x303b3e,.55),lampGlow=new THREE.MeshStandardMaterial({color:0xffe6ad,emissive:0xffc66d,emissiveIntensity:1.2});
for(let z=-51;z<=51;z+=17)for(const side of [-1,1]){
 const x=side*7.1;
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.085,5.1,7),lampMat);pole.position.set(x,2.55,z);scene.add(pole);
 const arm=box(scene,'Street lamp arm',x-side*.48,4.95,z,.95,.07,.07,lampMat);
 const head=new THREE.Mesh(new THREE.BoxGeometry(.38,.12,.25),lampGlow);head.position.set(x-side*.9,4.86,z);scene.add(head);
}
const parkedCars=[];
for(let i=0;i<7;i++){
 const c=new THREE.Group(),side=i%2?1:-1,z=-43+i*14;
 c.position.set(side*5.2,.02,z);scene.add(c);
 const paint=mat([0x485d69,0x8c4e42,0x9b9b91,0x344b42][i%4],.32);
 box(c,'Car lower body',0,.55,0,1.82,.58,3.55,paint);
 box(c,'Car cabin',0,1.02,-.22,1.48,.65,1.9,mat(0x344b54,.2));
 box(c,'Windshield',0,1.06,-1.2,1.34,.48,.035,mat(0x7d9ba4,.18));
 box(c,'Rear glass',0,1.06,.76,1.34,.48,.035,mat(0x526d76,.18));
 for(const xx of [-.94,.94])for(const zz of [-1.12,1.12]){
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.2,12),mat(0x1d2224));wheel.rotation.z=Math.PI/2;wheel.position.set(xx,.34,zz);c.add(wheel);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.205,10),mat(0x9da4a3,.45));hub.rotation.z=Math.PI/2;hub.position.set(xx,.34,zz);c.add(hub);
 }
 parkedCars.push(c);
}
const player=new THREE.Group();scene.add(player);
const body= new THREE.Group();player.add(body);
// Real CC0 human model. Loaded on demand; the simple rigged placeholder remains as fallback.
const humanStatus=document.createElement('div');
humanStatus.className='asset-status';
humanStatus.textContent='Загрузка 3D-персонажа…';
root.appendChild(humanStatus);
const humanLoader=new GLTFLoader();
humanLoader.load(
 'https://files.innerscene.com/library/idle-standing-sam-3d-person-animated-1f9f1217/4ca6054a9945f1c21da5/idle-standing-sam-3d-person-animated.glb',
 (gltf)=>{
   const human=gltf.scene;
   const bounds=new THREE.Box3().setFromObject(human);
   const size=bounds.getSize(new THREE.Vector3());
   const scale=1.8/Math.max(size.y,0.001);
   human.scale.setScalar(scale);
   const centered=new THREE.Box3().setFromObject(human);
   human.position.y-=centered.min.y;
   human.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;if(o.material){o.material.roughness=Math.max(o.material.roughness??.8,.72);}}});
   body.visible=false;
   player.add(human);
   if(gltf.animations?.length){
     const mixer=new THREE.AnimationMixer(human);
     const idle=gltf.animations.find(a=>/idle|stand/i.test(a.name))||gltf.animations[0];
     mixer.clipAction(idle).play();
     human.userData.mixer=mixer;
     human.userData.mixerAction=true;
   }
   humanStatus.remove();
 },
 undefined,
 (error)=>{console.warn('Human GLB could not be loaded; using fallback character.',error);humanStatus.textContent='Персонаж загружается позже · временная модель';setTimeout(()=>humanStatus.remove(),3500);}
);

const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.55,3,6),mats.shirt);torso.position.y=1.18;body.add(torso);
const head=new THREE.Mesh(new THREE.SphereGeometry(.23,8,6),mats.skin);head.position.y=1.85;body.add(head);
const legs=[];
for(const x of [-.16,.16]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.48,2,5),mats.pants);leg.position.set(x,.48,0);body.add(leg);legs.push(leg);}
player.position.set(0,0,-12);
const car=new THREE.Group();scene.add(car);car.position.set(3,.0,-7);
box(car,'Car body',0,.62,0,1.9,.65,3.5,mats.car);box(car,'Car windows',0,1.08,-.2,1.55,.48,1.75,mats.glass);
const carWheels=[];for(const x of [-.94,.94])for(const z of [-1.12,1.12]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.2,12),mat(0x202326));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.35,z);car.add(wheel);carWheels.push(wheel);}
let yaw=0,pitch=.12,moveX=0,moveY=0,walking=0,energy=100,hunger=100,health=100,money=1250,driving=false;
const stick=document.querySelector('#stick'),knob=document.querySelector('#knob');let movePointer=null,lastLook=null;
stick.addEventListener('pointerdown',e=>{movePointer=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e);});
stick.addEventListener('pointermove',e=>{if(e.pointerId===movePointer)updateStick(e);});
function updateStick(e){const r=stick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),len=Math.max(1,Math.hypot(dx,dy)),k=Math.min(34,len);moveX=dx/len*k/34;moveY=-dy/len*k/34;knob.style.transform=`translate(${dx/len*k}px,${dy/len*k}px)`;}
function stopStick(e){if(e.pointerId===movePointer){movePointer=null;moveX=moveY=0;knob.style.transform='translate(0,0)';}}
stick.addEventListener('pointerup',stopStick);stick.addEventListener('pointercancel',stopStick);
renderer.domElement.addEventListener('pointerdown',e=>{if(e.clientX>innerWidth*.45)lastLook={id:e.pointerId,x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointermove',e=>{if(lastLook&&lastLook.id===e.pointerId){yaw-=(e.clientX-lastLook.x)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastLook.y)*.003,-.12,.62);lastLook.x=e.clientX;lastLook.y=e.clientY;}});
function endLook(e){if(lastLook&&lastLook.id===e.pointerId)lastLook=null;}renderer.domElement.addEventListener('pointerup',endLook);renderer.domElement.addEventListener('pointercancel',endLook);
function toast(t){const el=document.querySelector('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2100);}
const actionButton=document.querySelector('#action');
actionButton.addEventListener('click',()=>{
 if(driving){driving=false;player.visible=true;player.position.set(car.position.x+1.8,0,car.position.z);player.rotation.y=car.rotation.y;toast('Вы вышли из автомобиля');return;}
 const d=player.position.distanceTo(car.position);
 if(d<4){driving=true;player.visible=false;player.position.copy(car.position);toast('Вы за рулём · джойстик управляет автомобилем');return;}
 toast('Подойдите ближе к автомобилю, чтобы сесть за руль');
});
function hud(){for(const [k,v] of Object.entries({health,energy,hunger})){document.getElementById(k).style.width=v+'%';document.getElementById(k+'-t').textContent=Math.round(v);}}
const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);
 const len=Math.hypot(moveX,moveY),moving=len>.08;
 const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 const dir=forward.multiplyScalar(moveY).add(right.multiplyScalar(moveX));if(dir.lengthSq()>1)dir.normalize();
 player.traverse(o=>{if(o.userData.mixer)o.userData.mixer.update(dt);});
 if(moving){
  if(driving){
   car.position.addScaledVector(dir,dt*8.2);
   car.rotation.y=Math.atan2(dir.x,dir.z);
   carWheels.forEach(w=>w.rotation.x-=dt*moveY*5);
   player.position.copy(car.position);
  }else{
   player.position.addScaledVector(dir,dt*(energy>0?3.5:2));
   player.rotation.y=Math.atan2(dir.x,dir.z);
   walking+=dt*9;legs[0].rotation.x=Math.sin(walking)*.55;legs[1].rotation.x=-Math.sin(walking)*.55;
   energy=Math.max(0,energy-dt*.24);
  }
 }else{legs.forEach(l=>l.rotation.x=0);if(!driving)energy=Math.min(100,energy+dt*.45);}
 hunger=Math.max(0,hunger-dt*.018);if(hunger<12)health=Math.max(1,health-dt*.03);
 const followed=driving?car:player;
 const target=new THREE.Vector3(followed.position.x+Math.sin(yaw)*Math.cos(pitch)*(driving?7:5),followed.position.y+(driving?3.6:2.7)+Math.sin(pitch)*3,followed.position.z+Math.cos(yaw)*Math.cos(pitch)*(driving?7:5));
 camera.position.lerp(target,1-Math.exp(-dt*7));camera.lookAt(followed.position.x,driving?1.05:1.25,followed.position.z);
 actionButton.textContent=driving?'ВЫЙТИ ИЗ АВТО':'ВЗАИМОДЕЙСТВИЕ';
 hud();renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.35));});
