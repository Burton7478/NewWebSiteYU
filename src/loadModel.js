import { OBJLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/OBJLoader.js";
import ModelCache from "./modelCache";

const modelCache = new ModelCache();


export function loadAllModels() {
    return modelCache.initDB().then(() => {
        return Promise.all([
             loadModel('/models/RobotX.obj'),
             loadModel('/models/PawnA.obj'),
             loadModel('/models/Hert.obj')
        ]).then((results) => {
            return Promise.resolve(results);
        })
    })
}

export function loadModel(url) {
    console.log("loadModel url:", url);
    return new Promise((resolve, reject) => {
        // Three.js 加载 OBJ 模型
        return loadModelFromCache(url).then((objUrl) => {
            const loader = new OBJLoader();
            loader.load(objUrl, (model) => {
                console.log("model load done:", model);
                resolve(model);
            });
        })
    })
}

// 加载模型时优先尝试读取缓存
function loadModelFromCache(url) {
    return new Promise((resolve, reject) => {
        modelCache.getModel(url).then(async (blob) => {
            if (!blob) {
                // 无缓存时从服务器下载
                const response = await fetch(url)
                blob = await response.blob();
                await modelCache.cacheModel(url, blob);
            }
            // 生成 Blob URL 供 Three.js 加载
            const blobUrl = URL.createObjectURL(blob);
            resolve(blobUrl)
        })
    })
}





// // 1) RobotX
// loader1.load(
//     '/models/RobotX.obj',
//     (o) => {
//         obj1 = o;
//         // 放在稍微偏左
//         obj1.position.set(50, 50, 0);
//         obj1.scale.set(0.01, 0.01, 0.01);
//         scene.add(obj1);
//     },
//     undefined,
//     (err) => console.error("Obj1 加载错误", err)
// );

// // 2) PawnA
// loader2.load(
//     '/models/PawnA.obj',
//     (o) => {
//         obj2 = o;
//         // 放在稍微偏右
//         obj2.position.set(-50, -50, 0);
//         obj2.scale.set(0.01, 0.01, 0.01);
//         scene.add(obj2);
//     },
//     undefined,
//     (err) => console.error("Obj2 加载错误", err)
// );

// // 3) Hert
// loader3.load(
//     '/models/Hert.obj',
//     (o) => {
//         obj3 = o;
//         obj3.position.set(0, 0, 0);
//         obj3.scale.set(0.005, 0.005, 0.005);
//         scene.add(obj3);

//         // 在 obj3 内部添加高强度点光
//         const innerLight = new THREE.PointLight(0xffffff, 2);
//         obj3.add(innerLight);
//     },
//     undefined,
//     (err) => console.error("Obj3 加载错误", err)
// );