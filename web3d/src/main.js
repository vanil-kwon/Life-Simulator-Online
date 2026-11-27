import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';

const root=document.querySelector('#game');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9eb8c5);
scene.fog=new THREE.Fog(0x9eb8c5,38,105);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,125);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'low-power',alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.0));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=false;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
root.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xdcecff,0x59604c,2.0));
const sun=new THREE.DirectionalLight(0xffe6c4,2.0);sun.position.set(-25,38,18);scene.add(sun);
const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness,metalness:0});
const mats={grass:mat(0x667c61),road:mat(0x343b40),side:mat(0xb7b6aa),white:mat(0xe4e0d4),glass:mat(0x7394a1,.35),skin:mat(0xc8916e),shirt:mat(0x304f67),pants:mat(0x26323b),car:mat(0x315d67,.55),line:mat(0xd8d2b6)};
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
  const b=box(scene,'Apartment building',x,h/2,z,w,h,7,mat(buildingColors[(i+(side>0?1:0))%buildingColors.length]));
  box(scene,'Facade base',x,h/2,z-side*3.54,w*.96,.3,.08,mats.white);
  const winMat=mat(0x66828b,.4);
  for(let row=1;row<Math.min(5,Math.floor(h/2));row++)for(let col=0;col<3;col++){
   box(scene,'Window',x+(col-1)*1.8,h*.15+row*1.35,z-side*3.57,.85,.7,.07,winMat);
  }
  if(i%3===0)box(scene,'Shop awning',x,h*.22,z-side*3.9,w*.75,.25,.6,mat(0x9b6552));
 }
}
for(let i=0;i<22;i++){const x=(i%2?1:-1)*(8+Math.random()*22),z=-58+Math.random()*116;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.2,1.7,5),mat(0x66503d));trunk.position.set(x,.85,z);scene.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.05,0),mat(0x58785d));crown.position.set(x,2,z);scene.add(crown);}
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
for(const x of [-.94,.94])for(const z of [-1.12,1.12]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.2,8),mat(0x202326));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.35,z);car.add(wheel);}
let yaw=0,pitch=.12,moveX=0,moveY=0,walking=0,energy=100,hunger=100,health=100,money=1250;
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
document.querySelector('#action').addEventListener('click',()=>{const d=player.position.distanceTo(car.position);if(d<4){toast('Автомобиль: управление добавим следующим этапом.');return;}toast('Исследуй район. Магазины и работа появятся в следующем обновлении.');});
function hud(){for(const [k,v] of Object.entries({health,energy,hunger})){document.getElementById(k).style.width=v+'%';document.getElementById(k+'-t').textContent=Math.round(v);}}
const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);
 const len=Math.hypot(moveX,moveY),moving=len>.08;
 const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 const dir=forward.multiplyScalar(moveY).add(right.multiplyScalar(moveX));if(dir.lengthSq()>1)dir.normalize();
 player.traverse(o=>{if(o.userData.mixer)o.userData.mixer.update(dt);});
 if(moving){player.position.addScaledVector(dir,dt*(energy>0?3.5:2));player.rotation.y=Math.atan2(dir.x,dir.z);walking+=dt*9;legs[0].rotation.x=Math.sin(walking)*.55;legs[1].rotation.x=-Math.sin(walking)*.55;energy=Math.max(0,energy-dt*.24);}else{legs.forEach(l=>l.rotation.x=0);energy=Math.min(100,energy+dt*.45);}
 hunger=Math.max(0,hunger-dt*.018);if(hunger<12)health=Math.max(1,health-dt*.03);
 const target=new THREE.Vector3(player.position.x+Math.sin(yaw)*Math.cos(pitch)*5,player.position.y+2.7+Math.sin(pitch)*3,player.position.z+Math.cos(yaw)*Math.cos(pitch)*5);
 camera.position.lerp(target,1-Math.exp(-dt*7));camera.lookAt(player.position.x,1.25,player.position.z);
 hud();renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.35));});
