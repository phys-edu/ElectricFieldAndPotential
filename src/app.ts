"use strict";
import * as THREE from 'three';
import { Line, Vector2, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import Stats from 'three/examples/jsm/libs/stats.module';

interface PointCharge{
    vec: Vector2
    sign : number
}


const params = {
    showElectricField: true,
};

const kQ : number = 1.0;
function calcE(points: PointCharge[], x: number, y: number): Vector2 {
    let ex = 0, ey = 0;
    for (const p of points) {
        const dx = x - p.vec.x;
        const dy = y - p.vec.y;
        const r = Math.sqrt(dx ** 2 + dy ** 2);
        ex += p.sign* kQ * dx / r ** 3;
        ey += p.sign * kQ * dy / r ** 3;
    }
    return new Vector2(ex, ey);
}
function calcV(points: PointCharge[], x: number, y: number): number{
    let v= 0;
    for (const p of points) {
        const dx = x - p.vec.x;
        const dy = y - p.vec.y;
        const r = Math.sqrt(dx ** 2 + dy ** 2);
        v += p.sign * kQ / r ;
    }
    return v;
}

const camera = new THREE.PerspectiveCamera(45, null, 0.1, 200);
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
let pointCharges = [
    { vec: new Vector2(+5, 0), sign: +1 },
    { vec: new Vector2(-5, 0), sign: -1 }
];


function onResize() :void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

}

window.addEventListener('resize', onResize, false);
window.addEventListener("DOMContentLoaded", () => {
    const targetPos = new Vector3(0, 0, 5);
    const container = document.getElementById('container');
    container.append(renderer.domElement)

    renderer.setClearColor(0xE1FCFF);
    renderer.shadowMap.enabled = true;
    
    const stats = Stats();
    stats.setMode(0);
    container.appendChild(stats.dom);

    camera.position.set(20, 20, 50);
    camera.up.set(0, 0, 1);
    camera.lookAt(targetPos);

    const splotLigth = new THREE.SpotLight(0xffffff);
    splotLigth.position.set(0, 0, 30);
    splotLigth.lookAt(targetPos);
    splotLigth.castShadow = true;
    scene.add(splotLigth);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const planeGeometry = new THREE.PlaneGeometry(50, 50);
    const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc ,side:THREE.DoubleSide});
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    scene.add(plane);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    const gui = new GUI();
    gui.add(params, 'showElectricField', false);
    gui.open();
    
    //
    for (const p of pointCharges) {
        const color = p.sign == 1 ? 0xff3333 : 0x3333ff;
        const pGeo = new THREE.CircleGeometry(1, 32);
        const pMat = new THREE.MeshLambertMaterial({ color: color });
        const pCir = new THREE.Mesh(pGeo, pMat);
        pCir.position.set(p.vec.x, p.vec.y, 0.01);
        scene.add(pCir);
    }
    const electricField = new THREE.Group;
    {
        const num =40;
        const r = 15;
        for (let i = 0; i < num; i++) {
            for (let j = 0; j < num; j++) {
                const xx = i * 2 * r / (num - 1) - r;
                const yy = j * 2 * r / (num - 1) - r;
                const org = new THREE.Vector3(xx, yy, 0.001);
                const ee = calcE(pointCharges, xx, yy);
                const len = ee.length()*10;
                const dir = (new Vector3(ee.x / len, ee.y / len, 0.0)).normalize();
                const arrowH = new THREE.ArrowHelper(dir, org, Math.min(2* r / num, len), 0xff0000);
                    electricField.add(arrowH);
            }
        }
    }
    scene.add(electricField);

    //
    onResize();
    const render = function () {
        stats.update();
        window.requestAnimationFrame(render);
        electricField.visible = params.showElectricField;
        renderer.render(scene, camera);
    };
    render();
});