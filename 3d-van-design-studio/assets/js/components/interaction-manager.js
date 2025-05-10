/**
 * Interaction Manager component for the Van Builder
 */
class InteractionManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.transformControls = null;
        this.selectedObject = null;
        this.transformMode = 'translate'; // 'translate', 'rotate', or 'scale'
        
        // Event callbacks
        this.onObjectTransformed = null;
        
        this.init();
    }
    
    init() {
        // Create transform controls
        this.transformControls = new THREE.TransformControls(
            this.sceneManager.camera, 
            this.sceneManager.renderer.domElement
        );
        
        // Add to scene
        this.sceneManager.scene.add(this.transformControls);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for transform control changes
        this.transformControls.addEventListener('change', () => {
            // Render scene on transform
            this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
        });
        
        // Listen for transform control dragging
        this.transformControls.addEventListener('dragging-changed', (event) => {
            // Enable/disable orbit controls when dragging
            this.sceneManager.controls.enabled = !event.value;
            
            // Call the callback when dragging ends
            if (!event.value && this.onObjectTransformed) {
                this.onObjectTransformed();
            }
        });
        
        
        // Set transform mode
        this.transformControls.setMode(this.transformMode);
        
        console.log('Transform controls attached to object:', object);
    }
    
    detachObject() {
        if (this.selectedObject) {
            this.transformControls.detach();
            this.selectedObject = null;
            
            console.log('Transform controls detached');
        }
    }
    
    setTransformMode(mode) {
        if (['translate', 'rotate', 'scale'].includes(mode)) {
            this.transformMode = mode;
            
            // Update UI
            $('.transform-button').removeClass('active');
            $(`#transform-${mode}`).addClass('active');
            
            if (this.selectedObject) {
                this.transformControls.setMode(mode);
                console.log('Transform mode set to:', mode);
            }
        }
    }
}
