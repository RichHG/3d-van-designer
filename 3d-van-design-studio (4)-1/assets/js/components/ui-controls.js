/**
 * UI Controls component for the Van Builder
 * Version: 1.0.0
 * Last Updated: 2025-05-11
 */
window.UIControlsModule = (function($) {
    'use strict';

    console.log('UI Controls module loading...');

    class UIControls {
        constructor(vanBuilder) {
            console.log("UIControls instantiated");
            this.vanBuilder = vanBuilder;
            this.activeTab = 'van-models';
            this.transformMode = 'translate';
            this.init();
        }

        init() {
            console.log("UIControls init called");
            this.setupAccordion();
            this.setupModals();
            this.setupCategoryButtons();
            this.setupTransformButtons();
            this.setupToolbarButtons();
            this.setupObjectProperties();
            this.setupSaveLoadHandlers();
            this.setupMaterialHandlers();
        }

        setupAccordion() {
            $('.van-builder-accordion-header').off('click').on('click', function() {
                $(this).toggleClass('active');
                $(this).next('.van-builder-accordion-content').slideToggle(200);
            });
        }

        setupModals() {
            // Close modal when clicking outside or on close button
            $('.van-builder-modal-close, .van-builder-modal').off('click').on('click', function(e) {
                if (e.target === this) {
                    $(this).closest('.van-builder-modal').hide();
                }
            });

            // Prevent modal content clicks from closing the modal
            $('.van-builder-modal-content').off('click').on('click', function(e) {
                e.stopPropagation();
            });
        }

        setupCategoryButtons() {
            $('.category-tab').off('click').on('click', (e) => {
                const category = $(e.currentTarget).data('category');
                this.switchCategory(category);
            });
        }

        setupTransformButtons() {
            $('.transform-button').off('click').on('click', (e) => {
                const mode = $(e.currentTarget).attr('id').replace('transform-', '');
                this.setTransformMode(mode);
                
                // Update button states
                $('.transform-button').removeClass('active');
                $(e.currentTarget).addClass('active');
            });
        }

        setupToolbarButtons() {
            $('#van-builder-toolbar button').off('click');

            $('#van-builder-undo').on('click', () => this.vanBuilder.undo());
            $('#van-builder-redo').on('click', () => this.vanBuilder.redo());
            $('#van-builder-reset-view').on('click', () => this.vanBuilder.sceneManager.resetCamera());
            $('#van-builder-toggle-grid').on('click', () => this.vanBuilder.sceneManager.toggleGrid());
            $('#van-builder-toggle-measurements').on('click', () => this.vanBuilder.sceneManager.toggleMeasurements());
            $('#van-builder-save').on('click', () => this.openSaveModal());
            $('#van-builder-load').on('click', () => this.openLoadModal());
            $('#van-builder-screenshot').on('click', () => this.vanBuilder.takeScreenshot());
            $('#van-builder-fullscreen').on('click', () => this.vanBuilder.toggleFullscreen());
        }

        setupObjectProperties() {
            const self = this;

            // Position inputs
            $('#position-x, #position-y, #position-z').off('change').on('change', function() {
                const axis = this.id.split('-')[1];
                const value = parseFloat(this.value);
                if (self.vanBuilder.selectedObject) {
                    self.vanBuilder.selectedObject.position[axis] = value;
                    self.vanBuilder.addToHistory();
                }
            });

            // Rotation inputs
            $('#rotation-x, #rotation-y, #rotation-z').off('input change').on('input change', function() {
                const axis = this.id.split('-')[1];
                const value = parseFloat(this.value) * Math.PI / 180;
                if (self.vanBuilder.selectedObject) {
                    self.vanBuilder.selectedObject.rotation[axis] = value;
                    if (event.type === 'change') {
                        self.vanBuilder.addToHistory();
                    }
                }
            });

            // Scale inputs
            $('#scale-uniform').off('change').on('change', function() {
                $('.scale-non-uniform').toggle(!this.checked);
            });

            $('#scale-x, #scale-y, #scale-z').off('change').on('change', function() {
                if (!self.vanBuilder.selectedObject) return;

                const uniform = $('#scale-uniform').is(':checked');
                const value = parseFloat(this.value);
                
                if (uniform) {
                    self.vanBuilder.selectedObject.scale.set(value, value, value);
                    $('#scale-x, #scale-y, #scale-z').val(value);
                } else {
                    const axis = this.id.split('-')[1];
                    self.vanBuilder.selectedObject.scale[axis] = value;
                }
                
                self.vanBuilder.addToHistory();
            });

            // Object actions
            $('#duplicate-object').off('click').on('click', () => {
                if (this.vanBuilder.selectedObject) {
                    this.vanBuilder.duplicateObject(this.vanBuilder.selectedObject);
                }
            });

            $('#remove-object').off('click').on('click', () => {
                if (this.vanBuilder.selectedObject) {
                    this.vanBuilder.removeObject(this.vanBuilder.selectedObject);
                }
            });
        }

        setupSaveLoadHandlers() {
            // Save design form
            $('#save-design-form').off('submit').on('submit', (e) => {
                e.preventDefault();
                this.vanBuilder.saveDesign();
            });

            // Load design buttons
            $('.load-design-button').off('click').on('click', function() {
                const designId = $(this).closest('.saved-design-item').data('design-id');
                this.vanBuilder.loadDesign(designId);
            });

            // Delete design buttons
            $('.delete-design-button').off('click').on('click', function() {
                const designId = $(this).closest('.saved-design-item').data('design-id');
                this.vanBuilder.deleteDesign(designId);
            });
        }

        setupMaterialHandlers() {
            // Material selection
            $('#materials-container').off('click').on('click', '.van-builder-material-item', (e) => {
                const materialId = $(e.currentTarget).data('material-id');
                if (this.vanBuilder.selectedObject) {
                    this.vanBuilder.applyMaterial(this.vanBuilder.selectedObject, materialId);
                }
            });

            // Color picker
            $('#object-color').off('change').on('change', (e) => {
                if (this.vanBuilder.selectedObject) {
                    this.vanBuilder.applyColor(this.vanBuilder.selectedObject, e.target.value);
                }
            });
        }

        updateObjectProperties(object) {
            if (!object) return;

            console.log("Updating object properties for:", object);

            // Show property panels
            $('.property-group, .property-actions').show();
            $('.no-selection-message').hide();

            // Update position inputs
            $('#position-x').val(object.position.x.toFixed(3));
            $('#position-y').val(object.position.y.toFixed(3));
            $('#position-z').val(object.position.z.toFixed(3));

            // Update rotation inputs (convert to degrees)
            $('#rotation-x').val((object.rotation.x * 180 / Math.PI).toFixed(1));
            $('#rotation-y').val((object.rotation.y * 180 / Math.PI).toFixed(1));
            $('#rotation-z').val((object.rotation.z * 180 / Math.PI).toFixed(1));

            // Update scale inputs
            $('#scale-x').val(object.scale.x.toFixed(3));
            $('#scale-y').val(object.scale.y.toFixed(3));
            $('#scale-z').val(object.scale.z.toFixed(3));

            // Update material/color if available
            if (object.material) {
                if (object.material.color) {
                    $('#object-color').val('#' + object.material.color.getHexString());
                }
                if (object.userData.materialId) {
                    $('#object-material').val(object.userData.materialId);
                }
            }

            // Enable/disable buttons based on object type
            $('#duplicate-object, #remove-object').prop('disabled', object.userData.isVan);
        }

        clearObjectProperties() {
            console.log("Clearing object properties");
            $('.property-group, .property-actions').hide();
            $('.no-selection-message').show();
            
            // Reset all inputs
            $('#object-properties input[type="number"]').val('0');
            $('#object-color').val('#ffffff');
            $('#object-material').val('none');
        }

        switchCategory(category) {
            this.activeTab = category;
            $('.category-tab').removeClass('active');
            $(`.category-tab[data-category="${category}"]`).addClass('active');
            $('.category-items').hide();
            $(`.category-items[data-category="${category}"]`).show();
        }

        setTransformMode(mode) {
            this.transformMode = mode;
            if (this.vanBuilder.interactionManager) {
                this.vanBuilder.interactionManager.setMode(mode);
            }
        }

        openSaveModal() {
            $('#save-design-modal').show();
        }

        openLoadModal() {
            // Refresh the list of saved designs before showing the modal
            this.refreshSavedDesignsList();
            $('#load-design-modal').show();
        }

        refreshSavedDesignsList() {
            // Implementation depends on your backend API
            // This is a placeholder for the actual implementation
            console.log("Refreshing saved designs list");
        }
    }

    console.log('UI Controls module initialized');

    // Return the module
    return {
        UIControls: UIControls
    };
})(jQuery);