/**
 * Model Loader component for the Van Builder
 * Version: 2.0.0
 * Last Updated: 2025-05-11
 * Author: RichHG
 */
class ModelLoader {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.gltfLoader = new THREE.GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        
        // Set up Draco decoder
        if (typeof THREE.DRACOLoader !== 'undefined') {
            const dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath(vanBuilderData.pluginUrl + 'assets/js/lib/draco/');
            this.gltfLoader.setDRACOLoader(dracoLoader);
        }
    }
    
    loadModel(url, callback) {
        this.showLoadingIndicator();
        
        this.gltfLoader.load(
            url,
            (gltf) => {
                const model = gltf.scene;
                
                // Enhanced material and mesh handling
                model.traverse((child) => {
                    if (child.isMesh) {
                        // Enable shadows
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Handle materials
                        if (child.material) {
                            // Clone material to prevent sharing
                            child.material = child.material.clone();
                            
                            // Configure material properties
                            child.material.needsUpdate = true;
                            child.material.colorWrite = true;
                            child.material.transparent = false;
                            child.material.opacity = 1;

                            // Configure based on material type
                            if (child.material.type === 'MeshStandardMaterial') {
                                child.material.metalness = 0.3;
                                child.material.roughness = 0.7;
                                child.material.envMapIntensity = 1.0;
                            } else if (child.material.type === 'MeshPhongMaterial') {
                                child.material.shininess = 30;
                                child.material.specular = new THREE.Color(0x444444);
                            }

                            // Set default color if material is black
                            if (child.material.color && child.material.color.getHex() === 0x000000) {
                                child.material.color.setHex(0xcccccc);
                            }
                        }
                    }
                });
                
                this.hideLoadingIndicator();
                
                if (callback) {
                    callback(model);
                }
            },
            (xhr) => {
                const percentComplete = (xhr.loaded / xhr.total) * 100;
                this.updateLoadingProgress(percentComplete);
            },
            (error) => {
                console.error('Error loading model:', error);
                this.hideLoadingIndicator();
                this.showErrorMessage('Failed to load model. Please try again.');
            }
        );
    }
    
    loadTexture(url, callback) {
        this.textureLoader.load(
            url,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);
                
                if (callback) {
                    callback(texture);
                }
            },
            undefined,
            (error) => {
                console.error('Error loading texture:', error);
                this.showErrorMessage('Failed to load texture. Please try again.');
            }
        );
    }
    
    showLoadingIndicator() {
        let loadingIndicator = document.querySelector('.van-builder-loading');
        
        if (!loadingIndicator) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'van-builder-loading';
            loadingIndicator.innerHTML = `
                <div class="van-builder-loading-spinner"></div>
                <div class="van-builder-loading-text">
                    Loading model... <span class="van-builder-loading-progress">0%</span>
                </div>
            `;
            
            document.querySelector('.van-builder-container').appendChild(loadingIndicator);
        }
        
        loadingIndicator.style.display = 'flex';
    }
    
    hideLoadingIndicator() {
        const loadingIndicator = document.querySelector('.van-builder-loading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
    
    updateLoadingProgress(percent) {
        const progressElement = document.querySelector('.van-builder-loading-progress');
        if (progressElement) {
            progressElement.textContent = Math.round(percent) + '%';
        }
    }
    
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'van-builder-error';
        errorDiv.textContent = message;
        
        document.querySelector('.van-builder-container').appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.classList.add('van-builder-error-fade-out');
            setTimeout(() => errorDiv.remove(), 300);
        }, 3000);
    }
}