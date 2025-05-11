/**
 * Scene Manager component for the Van Builder
 * Version: 2.0.0
 * Last Updated: 2025-05-11
 * Author: RichHG
 */
class SceneManager {
    constructor(canvasId) {
        console.log('SceneManager initializing...');
        this.canvasId = canvasId;
        this.objects = new Set();
        this.gridVisible = true;
        this.measurementsVisible = false;
        this.init();
        this.setupResizeHandler();
    }

    init() {
        try {
            this.initScene();
            this.initCamera();
            this.initRenderer();
            this.initLights();
            this.initGrid();
            this.initControls();
            this.animate();
            console.log('SceneManager initialized successfully');
        } catch (error) {
            console.error('Error initializing SceneManager:', error);
            throw error;
        }
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        this.scene.fog = new THREE.Fog(0xf0f0f0, 20, 100);
    }

    initCamera() {
        const container = document.getElementById(this.canvasId);
        if (!container) {
            throw new Error('Container not found: ' + this.canvasId);
        }

        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
    }

    initRenderer() {
        const container = document.getElementById(this.canvasId);
        
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        
        // Configure renderer
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Enable shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        container.appendChild(this.renderer.domElement);
    }

    initLights() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Hemisphere light for sky/ground reflection
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);

        // Main directional light (sun)
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(10, 10, 10);
        mainLight.castShadow = true;
        
        // Configure shadow properties
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -15;
        mainLight.shadow.camera.right = 15;
        mainLight.shadow.camera.top = 15;
        mainLight.shadow.camera.bottom = -15;
        mainLight.shadow.bias = -0.0001;
        
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // Store main lights for later reference
        this.mainLight = mainLight;
        this.fillLight = fillLight;
    }

    initGrid() {
        // Create grid
        this.grid = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
        this.grid.material.opacity = 0.5;
        this.grid.material.transparent = true;
        this.scene.add(this.grid);

        // Create ground plane for shadows
        const groundGeometry = new THREE.PlaneGeometry(40, 40);
        const groundMaterial = new THREE.ShadowMaterial({
            opacity: 0.3
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    initControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI / 2;
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            const container = document.getElementById(this.canvasId);
            const width = container.clientWidth;
            const height = container.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }

    addToScene(object) {
        this.scene.add(object);
        this.objects.add(object);
        
        // Ensure proper shadow casting
        object.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    removeFromScene(object) {
        this.scene.remove(object);
        this.objects.delete(object);
        
        // Clean up geometries and materials
        object.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }

    clearScene(keepLightsAndGrid = false) {
        const objectsToRemove = [];
        
        this.scene.traverse((object) => {
            if (keepLightsAndGrid) {
                if (!(object instanceof THREE.Light) && 
                    !(object instanceof THREE.GridHelper) && 
                    !(object === this.ground)) {
                    objectsToRemove.push(object);
                }
            } else if (object !== this.scene) {
                objectsToRemove.push(object);
            }
        });
        
        objectsToRemove.forEach(object => this.removeFromScene(object));
        
        if (!keepLightsAndGrid) {
            this.initLights();
            this.initGrid();
        }
    }

    focusOnObject(object) {
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Calculate camera position
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / Math.tan(fov / 2)) * 1.5;
        
        // Set camera position and target
        this.camera.position.set(
            center.x + cameraZ * 0.5,
            center.y + cameraZ * 0.5,
            center.z + cameraZ
        );
        this.controls.target.copy(center);
        
        // Update camera and controls
        this.camera.updateProjectionMatrix();
        this.controls.update();
    }

    getPositionInFrontOfCamera(distance) {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return this.camera.position.clone().add(direction.multiplyScalar(distance));
    }

    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        this.grid.visible = this.gridVisible;
        this.ground.visible = this.gridVisible;
    }

    toggleMeasurements() {
        this.measurementsVisible = !this.measurementsVisible;
        // Implementation for measurements visualization
    }

    resetCamera() {
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls
        this.controls.update();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        // Clean up resources
        this.clearScene(false);
        this.renderer.dispose();
        this.controls.dispose();
        
        // Remove event listeners
        window.removeEventListener('resize', this.setupResizeHandler);
    }
}