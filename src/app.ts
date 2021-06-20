"use strict";
import * as THREE from 'three';
import { Line, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import { generateUUID } from 'three/src/math/MathUtils';

const camera = new THREE.PerspectiveCamera(45, null, 0.1, 200);
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();

const params = {
    shellR : 1,
    showDenkirikisen: false,
    showElectricField: false,
    showShell: false
};

function onResize() :void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

}
class Denkirikisen{
    group: THREE.Group;
    private lines: THREE.Line[];
    private shell: THREE.Mesh;
    
    private readonly lineMaterial1 = new THREE.LineBasicMaterial({ color: 0x33ff33});
    private readonly lineMaterial2 = new THREE.LineBasicMaterial({ color: 0xff3333 });
    private readonly num = 250;    // 電気力線の本数
    private readonly radius = 15;  // 電気力線の半径
    readonly shellR_Min = 1;
    readonly shellR_Max = this.radius;

    calcShellAngle(shellR:number) {
        return Math.acos(1 - 2 * (this.shellR_Min / shellR)**2);
    }
    constructor(targetPos: Vector3) {
        const shellR = this.shellR_Min;
        const centerP = new THREE.Vector3(0, 0, 0);
  
        this.group = new THREE.Group;
        this.lines = new Array(this.num);
        const shellAngle = this.calcShellAngle(shellR);
        for (let i = 0; i < this.num; i++) {
            const p = i + 0.5;
            const phi = Math.acos(1 - 2.0 * p / this.num);
            const theta = Math.PI * (1 + Math.sqrt(5.0)) * p;
            const p1 = (new THREE.Vector3(
                Math.cos(theta) * Math.sin(phi),
                Math.cos(phi),
                Math.sin(theta) * Math.sin(phi)
            )).multiplyScalar(this.radius);
            const geo = new THREE.BufferGeometry().setFromPoints([centerP, p1]);
            this.lines[i] = new THREE.Line(geo, this.lineMaterial2);
            this.group.add(this.lines[i]);
        }

        this.shell = null;
        this.setShell(shellR);

        this.group.rotation.x = Math.PI / 2;
        this.group.position.copy(targetPos);
    }

    setShell(shellR: number) {
        if (params.showShell) {
            const shellAngle = this.calcShellAngle(shellR);
        
            const shellGeometry = new THREE.SphereBufferGeometry(shellR, 30, 10, 0, Math.PI * 2, 0, shellAngle);
            const shellMaterial = new THREE.MeshLambertMaterial({ color: 0x5555ff, side: THREE.DoubleSide });
            if (this.shell != null) this.group.remove(this.shell);
            this.shell = new THREE.Mesh(shellGeometry, shellMaterial);
            this.shell.castShadow = true;
            this.group.add(this.shell);

            const num = this.lines.length;
            for (let i = 0; i < num; i++) {
                const p = i + 0.5;
                const phi = Math.acos(1 - 2.0 * p / num);
                this.lines[i].material = phi > shellAngle ? this.lineMaterial1 : this.lineMaterial2;
            }
        }
    }
}


window.addEventListener('resize', onResize, false);
window.addEventListener("DOMContentLoaded", () => {
    const targetPos = new Vector3(0, 0, 10);
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
    
    const sphereGeometry = new THREE.SphereBufferGeometry(1, 10, 10);
    const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xff3333 });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(targetPos);
    sphere.castShadow = true;
    scene.add(sphere);

    const denkirikisen = new Denkirikisen(targetPos);
    scene.add(denkirikisen.group);
    denkirikisen.group.visible = false;
    
    const electricField = new THREE.Group;
    {
        const num = 8;
        const r = 15;
        for (let i = 0; i < num; i++) {
            for (let j = 0; j < num; j++) {
                for (let k = 0; k < num; k++) {
                    const xx = i * 2 * r / (num - 1) - r;
                    const yy = j * 2 * r / (num - 1) - r;
                    const zz = k * 2 * r / (num - 1);
                    const org = new THREE.Vector3(xx, yy, zz);
                    const rr = org.clone().sub(targetPos);
                    const len = Math.min(2 * r / num, r * 10 / (rr.length() ** 2));
                    const arrowH = new THREE.ArrowHelper(rr.normalize(), org, len, 0xff0000);
                    electricField.add(arrowH);
                }
            }
        }
    }
    scene.add(electricField);

    const controls = new OrbitControls(camera, renderer.domElement);
    const gui = new GUI();
    gui.add(params, 'showElectricField', false);
    gui.add(params, 'showDenkirikisen', false);
    gui.add(params, 'showShell', false);
    gui.add(params, 'shellR', 1, 10);
    gui.open();

    onResize();
    const render = function () {
        stats.update();
        denkirikisen.setShell(params.shellR);
        denkirikisen.group.visible = params.showDenkirikisen;
        electricField.visible = params.showElectricField;
        window.requestAnimationFrame(render);
        renderer.render(scene, camera);
    };
    render();
});