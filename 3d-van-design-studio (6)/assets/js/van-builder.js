/**
 * Main Van Builder JavaScript file
 */
(function($) {
    'use strict';

    class VanBuilder {
        constructor() {
            // Initialize history-related properties
            this.history = [];
            this.historyIndex = -1;
            this.maxHistorySteps = 50;

            this.init();
        }

        init() {
            // Check for dependencies before initializing
            if (typeof SceneManager === 'undefined' || 
                typeof ModelLoader === 'undefined' ||
                typeof InteractionManager === 'undefined' || 
                typeof window.UIControlsModule === 'undefined') {
                console.error('Missing dependencies:', {
                    SceneManager: typeof SceneManager,
                    ModelLoader: typeof ModelLoader,
                    InteractionManager: typeof InteractionManager,
                    UIControlsModule: typeof UIControlsModule
                });
                return;
            }

            // Initialize components
            this.sceneManager = new SceneManager('van-3d-canvas');
            this.modelLoader = new ModelLoader(this.sceneManager);
            this.interactionManager = new InteractionManager(this.sceneManager);

            // Log available models
            console.log('Available models:', vanBuilderData && vanBuilderData.availableModels);

            // Create UI Controls
            try {
                this.uiControls = new UIControlsModule.UIControls(this);
                console.log('UIControls initialized successfully');
            } catch (error) {
                console.error('Error initializing UIControls:', error);
                // Provide fallback UI controls
                this.uiControls = {
                    updateObjectProperties: (obj) => console.log('Fallback updateObjectProperties:', obj),
                    clearObjectProperties: () => console.log('Fallback clearObjectProperties'),
                    openSaveModal: () => console.log('Fallback openSaveModal'),
                    openLoadModal: () => console.log('Fallback openLoadModal')
                };
            }

            // Continue with initialization
            this.setupEventListeners();
            this.populateModelItems();

            const defaultVan = $('.van-builder-container').data('default-van') || 'sprinter';
            this.loadVanModel(defaultVan);
            this.addToHistory();

            console.log('VanBuilder initialized');
        }

        setupEventListeners() {
            // Accordion headers
            $('.category-header').on('click', (e) => {
                const section = $(e.currentTarget).parent('.category-section');
                const wasActive = section.hasClass('active');

                // Close all sections
                $('.category-section').removeClass('active');

                // If the clicked section wasn't active, open it
                if (!wasActive) {
                    section.addClass('active');
                }

                // Ensure proper display of items in the active section
                const categoryContent = section.find('.category-content');
                $('.category-content').not(categoryContent).slideUp();
                if (!wasActive) {
                    categoryContent.slideDown();
                } else {
                    categoryContent.slideUp();
                }
            });

            // Model items
            $('.van-builder-model-item').on('click', (e) => {
                const modelId = $(e.currentTarget).data('model-id');
                this.addFurnitureItem(modelId);
            });

            // Transform controls
            $('.transform-button').on('click', (e) => {
                const mode = $(e.currentTarget).attr('id').replace('transform-', '');
                this.setTransformMode(mode);
            });

            // Toolbar buttons
            $('#van-builder-undo').on('click', () => this.undo());
            $('#van-builder-redo').on('click', () => this.redo());
            $('#van-builder-reset-view').on('click', () => this.sceneManager.resetCamera());
            $('#van-builder-toggle-grid').on('click', () => this.sceneManager.toggleGrid());
            $('#van-builder-toggle-measurements').on('click', () => this.sceneManager.toggleMeasurements());
            $('#van-builder-save').on('click', () => this.uiControls.openSaveModal());
            $('#van-builder-load').on('click', () => this.uiControls.openLoadModal());
            $('#van-builder-screenshot').on('click', () => this.takeScreenshot());
            $('#van-builder-fullscreen').on('click', () => this.toggleFullscreen());

            // Object selection
            this.sceneManager.onObjectSelected = (object) => {
                this.selectedObject = object;
                this.interactionManager.attachToObject(object);
                if (this.uiControls) {
                    this.uiControls.updateObjectProperties(object);
                }
            };

            this.sceneManager.onObjectDeselected = () => {
                this.selectedObject = null;
                this.interactionManager.detachObject();
                if (this.uiControls) {
                    this.uiControls.clearObjectProperties();
                }
            };

            // Property changes
            $('#object-properties input, #object-properties select').on('change', () => {
                this.updateSelectedObject();
            });

            // Scale uniform checkbox
            $('#scale-uniform').on('change', function() {
                $('.scale-non-uniform').toggle(!this.checked);
            });

            // Object actions
            $('#duplicate-object').on('click', () => {
                if (this.selectedObject) {
                    this.duplicateObject(this.selectedObject);
                }
            });

            $('#remove-object').on('click', () => {
                if (this.selectedObject) {
                    this.removeObject(this.selectedObject);
                }
            });
        }

        populateModelItems() {
            if (!vanBuilderData || !vanBuilderData.availableModels) {
                console.error('vanBuilderData is not properly initialized:', vanBuilderData);
                return;
            }

            // Clear all containers first
            $('.category-items').empty();

            // Populate van models
            if (vanBuilderData.availableModels.vans) {
                const vanContainer = $('.category-items[data-category="van-models"]');
                vanBuilderData.availableModels.vans.forEach(model => {
                    vanContainer.append(this.createModelItem(model));
                });
            }

            // Populate furniture items in their respective categories
            if (vanBuilderData.availableModels.furniture) {
                vanBuilderData.availableModels.furniture.forEach(model => {
                    const category = model.category || 'furniture';
                    const container = $(`.category-items[data-category="${category}"]`);
                    if (container.length) {
                        container.append(this.createModelItem(model));
                    }
                });
            }

            // Add empty state messages
            $('.category-items').each(function() {
                if ($(this).children().length === 0) {
                    const category = $(this).data('category');
                    const message = category === 'van-models' ? 
                        'No van models available.' : 
                        `No ${category} items available.`;
                    $(this).html(`<div class="van-builder-empty">${message}</div>`);
                }
            });
        }

        createModelItem(model) {
            // Use a placeholder image if the thumbnail is missing
            const defaultThumbnail = vanBuilderData.assetsUrl + 'images/thumbnails/placeholder.png';
            
            const $item = $(`
                <div class="van-builder-model-item" data-model-id="${model.id}">
                    <img src="${model.thumbnail}" alt="${model.name}" onerror="this.src='${defaultThumbnail}'">
                    <span class="model-name">${model.name}</span>
                </div>
            `);

            $item.on('click', () => {
                if (model.category === undefined) {
                    this.loadVanModel(model.id);
                } else {
                    this.addFurnitureItem(model.id);
                }
            });

            return $item;
        }

        loadVanModel(modelId) {
            const vanModels = vanBuilderData.availableModels.vans;
            const modelData = vanModels.find(model => model.id === modelId);

            if (modelData) {
                // Clear existing scene except lights and camera
                this.sceneManager.clearScene(true);

                this.modelLoader.loadModel(modelData.file, (model) => {
                    model.userData.isVan = true;
                    model.userData.modelId = modelId;
                    model.userData.modelData = modelData;

                    // Calculate bounding box
                    const box = new THREE.Box3().setFromObject(model);
                    const height = box.max.y - box.min.y;
                    // Adjust the position to place the bottom of the van on the grid
                    model.position.y = Math.abs(box.min.y);

                    // Add to scene
                    this.sceneManager.addToScene(model);

                    // Center camera on model
                    this.sceneManager.focusOnObject(model);

                    // Add to history
                    this.addToHistory();
                });
            }
        }

        addFurnitureItem(modelId) {
            const furniture = vanBuilderData.availableModels.furniture;
            const modelData = furniture.find(model => model.id === modelId);

            if (modelData) {
                this.modelLoader.loadModel(modelData.file, (model) => {
                    model.userData.isFurniture = true;
                    model.userData.modelId = modelId;
                    model.userData.modelData = modelData;
                    
                    // Position in front of camera
                    const pos = this.sceneManager.getPositionInFrontOfCamera(3);
                    model.position.copy(pos);
                    
                    this.sceneManager.addToScene(model);
                    this.sceneManager.selectObject(model);
                    this.addToHistory();
                });
            }
        }

        updateSelectedObject() {
            if (!this.selectedObject) return;

            // Update position
            const x = parseFloat($('#position-x').val());
            const y = parseFloat($('#position-y').val());
            const z = parseFloat($('#position-z').val());
            this.selectedObject.position.set(x, y, z);

            // Update rotation
            const rx = parseFloat($('#rotation-x').val()) * Math.PI / 180;
            const ry = parseFloat($('#rotation-y').val()) * Math.PI / 180;
            const rz = parseFloat($('#rotation-z').val()) * Math.PI / 180;
            this.selectedObject.rotation.set(rx, ry, rz);

            // Update scale
            const uniform = $('#scale-uniform').is(':checked');
            const sx = parseFloat($('#scale-x').val());
            if (uniform) {
                this.selectedObject.scale.set(sx, sx, sx);
                $('#scale-y, #scale-z').val(sx);
            } else {
                const sy = parseFloat($('#scale-y').val());
                const sz = parseFloat($('#scale-z').val());
                this.selectedObject.scale.set(sx, sy, sz);
            }

            // Add to history
            this.addToHistory();
        }

        setTransformMode(mode) {
            $('.transform-button').removeClass('active');
            $(`#transform-${mode}`).addClass('active');
            this.interactionManager.setTransformMode(mode);
        }

        duplicateObject(object) {
            if (!object || object.userData.isVan) return;

            const clone = object.clone();
            clone.position.x += 0.5; // Offset slightly

            this.sceneManager.addToScene(clone);
            this.sceneManager.selectObject(clone);
            this.addToHistory();
        }

        removeObject(object) {
            if (!object || object.userData.isVan) return;

            this.sceneManager.removeFromScene(object);
            this.sceneManager.deselectObject();
            this.addToHistory();
        }

        addToHistory() {
            const sceneState = this.serializeScene();

            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }

            this.history.push(sceneState);
            this.historyIndex = this.history.length - 1;

            if (this.history.length > this.maxHistorySteps) {
                this.history.shift();
                this.historyIndex--;
            }

            this.updateUndoRedoButtons();
        }

        undo() {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.loadSceneState(this.history[this.historyIndex]);
                this.updateUndoRedoButtons();
            }
        }

        redo() {
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                this.loadSceneState(this.history[this.historyIndex]);
                this.updateUndoRedoButtons();
            }
        }

        updateUndoRedoButtons() {
            $('#van-builder-undo').prop('disabled', this.historyIndex <= 0);
            $('#van-builder-redo').prop('disabled', this.historyIndex >= this.history.length - 1);
        }

        serializeScene() {
            const objects = [];
            this.sceneManager.scene.traverse((object) => {
                if (object.userData.isVan || object.userData.isFurniture) {
                    objects.push({
                        id: object.id,
                        type: object.userData.isVan ? 'van' : 'furniture',
                        modelId: object.userData.modelId,
                        position: object.position.toArray(),
                        rotation: object.rotation.toArray(),
                        scale: object.scale.toArray()
                    });
                }
            });

            return {
                objects: objects,
                cameraPosition: this.sceneManager.camera.position.toArray(),
                cameraTarget: this.sceneManager.controls.target.toArray()
            };
        }

        loadSceneState(state) {
            this.sceneManager.clearScene(true);

            state.objects.forEach(objData => {
                if (objData.type === 'van') {
                    this.loadVanModel(objData.modelId);
                } else {
                    this.addFurnitureItem(objData.modelId);
                }
            });

            this.sceneManager.camera.position.fromArray(state.cameraPosition);
            this.sceneManager.controls.target.fromArray(state.cameraTarget);
            this.sceneManager.controls.update();
        }

        takeScreenshot() {
            $('.transform-controls-buttons').hide();
            const dataURL = this.sceneManager.renderer.domElement.toDataURL('image/png');
            $('.transform-controls-buttons').show();

            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'van-design-' + new Date().toISOString().slice(0, 10) + '.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        toggleFullscreen() {
            const container = $('.van-builder-container')[0];

            if (!document.fullscreenElement) {
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.mozRequestFullScreen) {
                    container.mozRequestFullScreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                } else if (container.msRequestFullscreen) {
                    container.msRequestFullscreen();
                }
                $('#van-builder-fullscreen .dashicons').removeClass('dashicons-fullscreen-alt').addClass('dashicons-fullscreen-exit-alt');
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                $('#van-builder-fullscreen .dashicons').removeClass('dashicons-fullscreen-exit-alt').addClass('dashicons-fullscreen-alt');
            }

            setTimeout(() => {
                this.sceneManager.onWindowResize();
            }, 100);
        }
    }

    // Initialize when document is ready
    $(document).ready(function() {
        // Check for THREE.js and other dependencies *before* instantiating VanBuilder
        if (typeof THREE === 'undefined' || typeof SceneManager === 'undefined' ||
            typeof ModelLoader === 'undefined' || typeof InteractionManager === 'undefined' ||
            typeof window.UIControlsModule === 'undefined') {
            console.error('Missing dependencies. Make sure Three.js and other components are loaded before van-builder.js.');
            return;
        }

        window.vanBuilder = new VanBuilder();
    });
})(jQuery);