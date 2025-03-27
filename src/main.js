import "./style.css";
import "./Style.scss";
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/OBJLoader.js";
import { throttle } from 'lodash-es';

import VanillaTilt from "vanilla-tilt";
import { initBoxCarousel } from "./IconChange.js";
import { gsap } from 'gsap';

import { loadAllModels } from './loadModel';







// ========== 你想随意放置的模型 ==========

// 如果你已有加载逻辑，就直接放进来
// 以下只是简单示例
loadAllModels().then((results) => {
  obj1 = results[0];
  obj2 = results[1];
  obj3 = results[2];

  // 自由设置它们在场景中的位置 / 大小
  obj1.position.set(50, 50, 0);
  obj1.scale.set(0.01, 0.01, 0.01);
  scene.add(obj1);

  obj2.position.set(-50, -50, 0);
  obj2.scale.set(0.01, 0.01, 0.01);
  scene.add(obj2);

  obj3.position.set(0, 0, 0);
  obj3.scale.set(0.005, 0.005, 0.005);
  scene.add(obj3);

  // 比如给 obj3 加个点光源
  const innerLight = new THREE.PointLight(0xffffff, 2);
  obj3.add(innerLight);

  // ========== 重点：定义相机的两个位置与 lookAt 点 ==========

  // 第一个相机位置
  const camPosA = new THREE.Vector3(52, 60, -1);
  // 第一个相机看向点
  const lookAtA = new THREE.Vector3(0, 0, 0);

  // 第二个相机位置
  const camPosB = new THREE.Vector3(-51, -50, 2);
  // 第二个相机看向点
  const lookAtB = new THREE.Vector3(0, 0, 0);

  // 先把相机放在初始位置(=camPosA)并看向A
  camera.position.copy(camPosA);
  camera.lookAt(lookAtA);
  camera.updateProjectionMatrix();

  // ========== 建立 GSAP timeline，用来在滚动时控制相机位置 ==========

  // 注意： paused: true => 不会自动播放，由滚动事件手动同步
  let cameraTL = gsap.timeline({ paused: true });

  // 让相机从 A -> B
  // (也可以先来个 fromTo，如果你想要更可控。这里示例直接 from 当前值 -> B)
  cameraTL.to(camera.position, {
    x: camPosB.x,
    y: camPosB.y,
    z: camPosB.z,
    duration: 1.0, // 你想要的时长
    onUpdate: () => {
      // 在运动过程中，让相机一直看向某个点（这里看向B，或者也可以看向A和B之间插值）
      camera.lookAt(lookAtB); 
      camera.updateProjectionMatrix();
    }
  }, 0);

  // 也可以继续 .to(...) 接着做第二段动画
  // cameraTL.to(camera.position, { ... });

  // ========== 监听滚动条，转动 timeline.progress() ==========

  window.addEventListener('scroll', throttle(onScroll, 10));

  function onScroll() {
    if (!cameraTL) return;

    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;

    let scrollPercent = scrollTop / docHeight;
    scrollPercent = Math.max(0, Math.min(1, scrollPercent));

    cameraTL.progress(scrollPercent);
  }
});

// ========== 监听尺寸变化 ==========

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});


//控制网页跳转
let navLinks = document.querySelectorAll("a.inner-link");
navLinks.forEach((item) => {
  // 阻止 <a> 的默认跳转，改用 JS 来切换页面
  item.addEventListener("click", function (e) {
    e.preventDefault();

    // 1. 去掉之前链接上的 .active
    let currentActiveLink = document.querySelector("nav ul li a.active");
    if (currentActiveLink) {
      currentActiveLink.classList.remove("active");
    }
    // 2. 给自己加 .active
    item.classList.add("active");

    // 3. 找到当前显示的section，移除 .active
    let currentActiveSection = document.querySelector("main > section.active");
    if (currentActiveSection) {
      currentActiveSection.classList.remove("active");
    }

    // 4. 找到对应的 section 并加上 .active
    let targetID = item.getAttribute("href"); // #home / #work1 / ...
    let targetSection = document.querySelector(`main > section${targetID}`);
    if (targetSection) {
      targetSection.classList.add("active");
    }
  });
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// 给相机一个初始位置
//camera.position.set(0, 0, 30);

// OrbitControls（可鼠标旋转、缩放），可选
const controls = new OrbitControls(camera, renderer.domElement);

// // ------------------- 载入三个OBJ模型 -------------------
// const loader1 = new OBJLoader();
// const loader2 = new OBJLoader();
// const loader3 = new OBJLoader();

let obj1, obj2, obj3;

// 一些辅助函数：获取模型的包围盒中心 & 计算相机合适距离
function getObjectCenterAndSize(object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  return { center, size };
}
function getCameraPositionForObj(obj, extraScale = 1.5) {
  const { center, size } = getObjectCenterAndSize(obj);
  const maxDim = Math.max(size.x, size.y, size.z);
  // 计算相机需要多远能看下整个模型
  const fovRad = (camera.fov * Math.PI) / 180;
  let cameraDist = maxDim / 2 / Math.tan(fovRad / 2);
  cameraDist *= extraScale;
  // 简化：仅在 z 方向上拉开距离，也可自由选择
  return new THREE.Vector3(center.x, center.y, center.z + cameraDist);
}

let cameraTL = null; // GSAP timeline



// 监听滚动 => 更新 timeline 的 progress
window.addEventListener('scroll',
  throttle(onScroll, 1));

function onScroll() {
  console.log('onScroll')
  if (!cameraTL) return;  // timeline还没建好

  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return;

  // 滚动百分比
  let scrollPercent = scrollTop / docHeight;
  scrollPercent = Math.max(0, Math.min(1, scrollPercent));

  // 同步到 timeline
  cameraTL.progress(scrollPercent);
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});


//控制卡片旋转

function setupTilt() {
  VanillaTilt.init(document.querySelectorAll(".card"), {
    max: 20, // 最大倾斜角度，再大一点会更“夸张”
    speed: 400, // 动画速度
    glare: true, // 光晕效果
    "max-glare": 0.2, // 光晕最大透明度
    perspective: 700, // 透视深度，小一点可以增强 3D 感
    scale: 1.03, // 鼠标悬停时放大比例
    "full-page-listening": false, // 是否在页面任意位置监听
    "mouse-event-element": null, // 可以自定义监听的容器
    reset: true, // 鼠标离开时重置卡片角度
    gyroscope: true, // 移动端陀螺仪支持
  });
}

setupTilt();

//控制视频播放

document.addEventListener('DOMContentLoaded', function () {
  // 选到页面上所有的视频
  const videos = document.querySelectorAll('.rounded-video');
  // 选到页面上所有的播放图标
  const playIcons = document.querySelectorAll('.play-icon');

  // 给每对(video, playIcon)设置同样的逻辑
  // 注意，如果你有多个视频，最好确保 playIcon 的数量和视频数量对应
  // 一种简易写法是根据索引遍历:
  videos.forEach((video, index) => {
    const icon = playIcons[index];
    
    // 初始状态
    if (video.paused) {
      icon.style.display = 'inline';
    } else {
      icon.style.display = 'none';
    }

    // 点击播放图标：开始/暂停切换
    icon.addEventListener('click', function () {
      if (video.paused) {
        video.play();
        icon.style.display = 'none';
      } else {
        video.pause();
        icon.style.display = 'inline';
      }
    });

    // 视频暂停事件 - 显示图标
    video.addEventListener('pause', function () {
      icon.style.display = 'inline';
    });

    // 视频结束事件 - 显示图标
    video.addEventListener('ended', function () {
      icon.style.display = 'inline';
    });

    // 双击全屏
    video.addEventListener('dblclick', function () {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen(); // Safari
      }
    });
  });
});


//控制切卡功能

document.addEventListener("DOMContentLoaded", () => {

  const data1 = [
    { type: "image", src: "images/Skill/S1.png", width: 200, height: 130, alt: "Card 1", title: "VFX" },
    { type: "image", src: "images/Skill/S2.png", width: 220, height: 150, alt: "Card 2", title: "OnlineSystem" },
    { type: "image", src: "images/Skill/S3.png", width: 180, height: 120, alt: "Card 3", title: "AI" },
    { type: "image", src: "images/Skill/S4.png", width: 320, height: 240, alt: "Card 4", title: "WebSite" },
    { type: "image", src: "images/Skill/S5.png", width: 220, height: 140, alt: "Card 5", title: "Interaction Art" },
    { type: "image", src: "images/Skill/S6.png", width: 220, height: 140, alt: "Card 6", title: "Game Engine" },
  ];
  // 作用于 #work1 .container11 .box
  initBoxCarousel("#home .container2 .box", data1, "#home .container2 .Icando .dynamic-title");

  const data2 = [
    {   type: "iframe",
    src: "https://www.youtube.com/embed/ikdR_msPj1I?si=vAW9xRJ35x257Dme",
    width: 440,
    height: 440,
    alt: "Card 1",
    title: "CG1" }, // 示例视频
    {   type: "iframe",
    src: "https://www.youtube.com/embed/Iww-WoN8mPs?si=hBAlHhqimR7QD0um",
    width: 440,
    height: 440,
    alt: "Card 1",
    title: "CG2" }, 
    {   type: "iframe",
    src: "https://www.youtube.com/embed/tBoei3Sd7ho?si=QfC1yCfokli0_SHZ",
    width: 440,
    height: 440,
    alt: "Card 1",
    title: "CG3" }, 
    {   type: "iframe",
    src: "https://www.youtube.com/embed/SwidSrc7aA8?si=VrBc8iTvGEa6D-8z",
    width: 440,
    height: 440,
    alt: "Card 1",
    title: "CG4" }, 
  ];
  // 作用于 #work1 .container11 .box
  initBoxCarousel("#work1 .container11 .box", data2,"#work1 .container11 .Icando .dynamic-title");
  // 第一次调用 => container11, 混合图片 + 视频



  const data3 = [

    { type: "video", src: "video/Others/B2.mov", width: 440, height: 440,alt: "Card 1", title: "PickUp"}, // 示例视频
    { type: "video", src: "video/Others/B3.mov", width: 440, height: 440 ,alt: "Card 1", title: "Skill"}, // 示例视频
    { type: "video", src: "video/Others/B4.mov", width: 440, height: 440 ,alt: "Card 1", title: "Weaapon"}, // 示例视频

  ];

  initBoxCarousel("#work2 .container19 .box", data3,"#work2 .container19 .Icando .dynamic-title");

  const data14 = [
    {
      type: "image",
      src: "images/Test/7.jpg",
      width: 560,
      height: 396,
      alt: "Pic 1",
    },
    {
      type: "image",
      src: "images/Test/8.jpg",
      width: 560,
      height: 396,
      alt: "Pic 2",
    },
    {
      type: "image",
      src: "images/Test/9.jpg",
      width: 560,
      height: 396,
      alt: "Pic 3",
    },
    {
      type: "image",
      src: "images/Test/10.jpg",
      width: 560,
      height: 396,
      alt: "Pic 4",
    },
    {
      type: "image",
      src: "images/Test/11.jpg",
      width: 560,
      height: 396,
      alt: "Pic 5",
    },  {
      type: "image",
      src: "images/Test/12.jpg",
      width: 560,
      height: 396,
      alt: "Pic 6",
    },
  ];

  initBoxCarousel("#work3 .container24 .box", data14);

  // const data15 = [
  //   {
  //     type: "image",
  //     src: "images/Test/B4.png",
  //     width: 200,
  //     height: 130,
  //     alt: "Pic 1",
  //   },
  //   {
  //     type: "image",
  //     src: "images/Test/B5.png",
  //     width: 200,
  //     height: 130,
  //     alt: "Pic 2",
  //   },
  //   {
  //     type: "image",
  //     src: "images/Test/B6.png",
  //     width: 200,
  //     height: 130,
  //     alt: "Pic 3",
  //   },
  //   {
  //     type: "image",
  //     src: "images/Test/B7.png",
  //     width: 200,
  //     height: 130,
  //     alt: "Pic 4",
  //   },
  // ];

  // initBoxCarousel("#work3 .container25 .box", data15);

  // 如果你还有第三次、第四次，也可以继续调
  // initBoxCarousel(...);
});


//控制场景渲染






// ------------------- 星星，放在 pivotGroup 中绕中心转 -------------------
const pivotGroup = new THREE.Group();
scene.add(pivotGroup);

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  // 随机位置
  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
  star.position.set(x, y, z);

  pivotGroup.add(star);
}
Array(350).fill().forEach(addStar);

// ------------------- 灯光（全局） -------------------
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// 也可加一个全局点光或定向光
const pointLight = new THREE.PointLight(0xffffff, 0.2);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);



// ------------------- 动画循环 -------------------
function animate() {
  requestAnimationFrame(animate);

  // 星星绕中心转
  pivotGroup.rotation.y += 0.0005;

  // 如果想让obj1/obj2/obj3自转，也可以在这里加
  if (obj1) obj1.rotation.y += 0.01;
  if (obj2) obj2.rotation.y += 0.01;
  if (obj3) obj3.rotation.y += 0.01;

  controls.update();
  renderer.render(scene, camera);
}
animate();

// ====================== GSAP + 滚动分段 ======================
// 我们想要：scroll顶部 => obj1，scroll中部 => obj3，scroll底部 => obj2
// 简单做法：用 GSAP Timeline，
//   0   -> 0.33 ->   0.66  -> 1
//   obj1 -> obj3 -> obj2
//
// 当对象还没加载完可能拿不到尺寸；我们可以在滚动时再计算（或者等加载完后再建 timeline）。
// 为了演示，这里用“延时重建 timeline”的方式保证都加载完成后再做。

