class SceneManager {
    constructor(canvasId) {
        console.log('SceneManager initializing...');
        this.canvasId = canvasId;
        this.init();
    }

    init() {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xf0f0f0);

            // Get container
            const container = document.getElementById(this.canvasId);
            if (!container) {
                throw new Error('Container not found: ' + this.canvasId);
            }

            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                container.clientWidth / container.clientHeight,
                0.1,
                1000
            );
            this.camera.position.set(5, 5, 5);
            this.camera.lookAt(0, 0, 0);

            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(container.clientWidth, container.clientHeight);
            container.appendChild(this.renderer.domElement);

            // Add grid
            const grid = new THREE.GridHelper(20, 20);
            this.scene.add(grid);

            // Add lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 10);
            this.scene.add(directionalLight);

            // Add controls
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

            // Start rendering
            this.animate();

            console.log('SceneManager initialized successfully');
        } catch (error) {
            console.error('Error initializing SceneManager:', error);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
