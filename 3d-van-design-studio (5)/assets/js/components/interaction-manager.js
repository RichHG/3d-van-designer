class InteractionManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.transformControls = null;
        this.selectedObject = null;
        this.transformMode = 'translate';
        this.onObjectTransformed = null;
    }

    init() {
        this.transformControls = new THREE.TransformControls(
            this.sceneManager.camera,
            this.sceneManager.renderer.domElement
        );
        this.sceneManager.scene.add(this.transformControls);
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.transformControls.addEventListener('change', () => {
            this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
        });

        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.sceneManager.controls.enabled = !event.value;
            if (!event.value && this.onObjectTransformed) {
                this.onObjectTransformed();
            }
        });

        this.transformControls.setMode(this.transformMode);

        // Remove the erroneous console.log
    }

    // *** CRUCIAL: Add the attachToObject method ***
    attachToObject(object) {
        if (object) {
            this.selectedObject = object;
            this.transformControls.attach(object);
        }
    }


    detachObject() {
        if (this.selectedObject) {
            this.transformControls.detach();
            this.selectedObject = null;
        }
    }

    setTransformMode(mode) {
        if (['translate', 'rotate', 'scale'].includes(mode)) {
            this.transformMode = mode;
            $('.transform-button').removeClass('active');
            $(`#transform-${mode}`).addClass('active');
            if (this.selectedObject) {
                this.transformControls.setMode(mode);
            }
        }
    }
}
