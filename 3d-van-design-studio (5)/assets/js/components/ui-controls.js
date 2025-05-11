/**
 * UI Controls component for the Van Builder
 * Version: 2.1.0
 * Last Updated: 2025-05-11
 * Author: RichHG
 */
window.UIControlsModule = (function($) {
    'use strict';

    class UIControls {
        constructor(vanBuilder) {
            this.vanBuilder = vanBuilder;
            this.activeTab = 'van-models';
            this.transformMode = 'translate';
            this.init();
        }

        init() {
            // Initialize UI state
            $('.category-items').hide();
            $('.category-items[data-category="van-models"]').show();
            $('.properties-panel .properties-content').hide();
            $('.properties-panel .no-selection-message').show();
            
            // Setup all event handlers
            this.setupCategoryTabs();
            this.setupTransformControls();
            this.setupPropertyControls();
            this.setupMaterialHandlers();
            this.setupKeyboardShortcuts();
            
            // Set initial states
            this.switchCategory('van-models');
            this.setTransformMode('translate');
        }

        setupCategoryTabs() {
            $('.category-tab').off('click').on('click', (e) => {
                const category = $(e.currentTarget).data('category');
                this.switchCategory(category);
            });
        }

        setupTransformControls() {
            $('.transform-button').off('click').on('click', (e) => {
                const mode = $(e.currentTarget).attr('id').replace('transform-', '');
                this.setTransformMode(mode);
                $('.transform-button').removeClass('active');
                $(e.currentTarget).addClass('active');
            });
        }

        setupPropertyControls() {
            // Position controls
            $('.property-input[id^="position-"]').off('change').on('change', (e) => {
                if (!this.vanBuilder.selectedObject) return;
                const axis = e.target.id.split('-')[1];
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                    this.vanBuilder.selectedObject.position[axis] = value;
                    this.vanBuilder.addToHistory();
                }
            });

            // Rotation controls
            $('.property-input[id^="rotation-"]').off('input change').on('input change', (e) => {
                if (!this.vanBuilder.selectedObject) return;
                const axis = e.target.id.split('-')[1];
                const value = parseFloat(e.target.value) * Math.PI / 180;
                if (!isNaN(value)) {
                    this.vanBuilder.selectedObject.rotation[axis] = value;
                    this.updateRotationDisplayValue(axis, e.target.value);
                    if (e.type === 'change') {
                        this.vanBuilder.addToHistory();
                    }
                }
            });

            // Scale controls
            $('#scale-uniform').off('change').on('change', (e) => {
                $('.scale-non-uniform').toggle(!e.target.checked);
                if (e.target.checked) {
                    const value = parseFloat($('#scale-x').val());
                    if (!isNaN(value)) {
                        this.applyUniformScale(value);
                    }
                }
            });

            $('.property-input[id^="scale-"]').off('change').on('change', (e) => {
                if (!this.vanBuilder.selectedObject) return;
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                    if ($('#scale-uniform').is(':checked')) {
                        this.applyUniformScale(value);
                    } else {
                        const axis = e.target.id.split('-')[1];
                        this.vanBuilder.selectedObject.scale[axis] = value;
                    }
                    this.vanBuilder.addToHistory();
                }
            });

            // Object actions
            $('#duplicate-object').off('click').on('click', () => {
                if (this.vanBuilder.selectedObject && !this.vanBuilder.selectedObject.userData.isVan) {
                    this.vanBuilder.duplicateObject(this.vanBuilder.selectedObject);
                }
            });

            $('#remove-object').off('click').on('click', () => {
                if (this.vanBuilder.selectedObject && !this.vanBuilder.selectedObject.userData.isVan) {
                    this.vanBuilder.removeObject(this.vanBuilder.selectedObject);
                }
            });
        }

        setupMaterialHandlers() {
            $('#materials-container').off('click').on('click', '.van-builder-material-item', (e) => {
                const materialId = $(e.currentTarget).data('material-id');
                if (this.vanBuilder.selectedObject) {
                    this.vanBuilder.applyMaterial(this.vanBuilder.selectedObject, materialId);
                }
            });

            $('#object-color').off('change').on('change', (e) => {
                if (this.vanBuilder.selectedObject) {
                    this.vanBuilder.applyColor(this.vanBuilder.selectedObject, e.target.value);
                }
            });
        }

        setupKeyboardShortcuts() {
            $(document).off('keydown.vanbuilder').on('keydown.vanbuilder', (e) => {
                if (e.target.tagName === 'INPUT') return;
                
                const shortcuts = {
                    'g': () => this.setTransformMode('translate'),
                    'r': () => this.setTransformMode('rotate'),
                    's': () => this.setTransformMode('scale'),
                    'Delete': () => {
                        if (this.vanBuilder.selectedObject && !this.vanBuilder.selectedObject.userData.isVan) {
                            this.vanBuilder.removeObject(this.vanBuilder.selectedObject);
                        }
                    }
                };

                if (shortcuts[e.key]) {
                    e.preventDefault();
                    shortcuts[e.key]();
                }
            });
        }

        updateObjectProperties(object) {
            if (!object) {
                this.clearObjectProperties();
                return;
            }

            $('.properties-panel .properties-content').show();
            $('.properties-panel .no-selection-message').hide();

            // Update position
            ['x', 'y', 'z'].forEach(axis => {
                $(`#position-${axis}`).val(object.position[axis].toFixed(3));
            });

            // Update rotation (convert to degrees)
            ['x', 'y', 'z'].forEach(axis => {
                const degrees = (object.rotation[axis] * 180 / Math.PI).toFixed(1);
                $(`#rotation-${axis}`).val(degrees);
                this.updateRotationDisplayValue(axis, degrees);
            });

            // Update scale
            ['x', 'y', 'z'].forEach(axis => {
                $(`#scale-${axis}`).val(object.scale[axis].toFixed(3));
            });

            // Enable/disable buttons based on object type
            const isVan = object.userData.isVan;
            $('#duplicate-object, #remove-object').prop('disabled', isVan);
        }

        clearObjectProperties() {
            $('.properties-panel .properties-content').hide();
            $('.properties-panel .no-selection-message').show();
            $('.property-input[type="number"]').val('0');
            $('.property-input[type="range"]').val('0');
            $('.property-value').text('0°');
            $('#scale-uniform').prop('checked', true);
            $('.scale-non-uniform').hide();
        }

        switchCategory(category) {
            this.activeTab = category;
            $('.category-tab').removeClass('active');
            $(`.category-tab[data-category="${category}"]`).addClass('active');
            $('.category-items').hide();
            $(`.category-items[data-category="${category}"]`).show().css('display', 'grid');
        }

        setTransformMode(mode) {
            this.transformMode = mode;
            if (this.vanBuilder.transformControls) {
                this.vanBuilder.transformControls.setMode(mode);
            }
            $('.transform-button').removeClass('active');
            $(`#transform-${mode}`).addClass('active');
        }

        updateRotationDisplayValue(axis, value) {
            $(`#rotation-${axis}`).siblings('.property-value').text(`${parseFloat(value).toFixed(1)}°`);
        }

        applyUniformScale(value) {
            if (this.vanBuilder.selectedObject) {
                this.vanBuilder.selectedObject.scale.set(value, value, value);
                $('.property-input[id^="scale-"]').val(value);
            }
        }

        showMessage(message, type = 'info') {
            const messageDiv = $('<div>')
                .addClass(`van-builder-message van-builder-message-${type}`)
                .text(message)
                .appendTo('.van-builder-container');

            setTimeout(() => {
                messageDiv.fadeOut(() => messageDiv.remove());
            }, 3000);
        }

        dispose() {
            // Clean up event listeners
            $(document).off('keydown.vanbuilder');
            $('.category-tab').off('click');
            $('.transform-button').off('click');
            $('.property-input').off('change input');
            $('#scale-uniform').off('change');
            $('#duplicate-object, #remove-object').off('click');
            $('#materials-container').off('click');
            $('#object-color').off('change');
        }
    }

    return {
        UIControls: UIControls
    };
})(jQuery);