/**
 * UI Controls component for the Van Builder
 */
(function($) {
    'use strict';

    class UIControls {
        constructor(vanBuilder) {
            this.vanBuilder = vanBuilder;

            this.init();
        }

        init() {
            // Set up accordion functionality
            this.setupAccordion();

            // Set up modal functionality
            this.setupModals();
        }

        setupAccordion() {
            // Use a delegated event handler to ensure it works for dynamically added content
            $('.van-builder-accordion').on('click', '.van-builder-accordion-header', function() {
                $(this).toggleClass('active');
                $(this).next('.van-builder-accordion-content').slideToggle(200);
            });
        }

        setupModals() {
            // Close modal when clicking the close button or outside the modal
            $('.van-builder-modal-close, .van-builder-modal').on('click', function(e) {
            if (e.target === this) {
                $(this).closest('.van-builder-modal').hide();
            }
        });

        // Prevent clicks inside modal content from closing the modal
        $('.van-builder-modal-content').on('click', function(e) {
            e.stopPropagation();
        });
    }

    updateObjectProperties(object) {
        if (!object) return;

        // Show property groups
        $('.property-group, .property-actions').show();
        $('.no-selection-message').hide();

        // Update position inputs
        $('#position-x').val(object.position.x.toFixed(2));
        $('#position-y').val(object.position.y.toFixed(2));
        $('#position-z').val(object.position.z.toFixed(2));

        // Update rotation sliders
        const rotX = (object.rotation.x * 180 / Math.PI) % 360;
        const rotY = (object.rotation.y * 180 / Math.PI) % 360;
        const rotZ = (object.rotation.z * 180 / Math.PI) % 360;

        $('#rotation-x').val(rotX.toFixed(0));
        $('#rotation-y').val(rotY.toFixed(0));
        $('#rotation-z').val(rotZ.toFixed(0));

        $('#rotation-x').next('.property-value').text(rotX.toFixed(0) + '°');
        $('#rotation-y').next('.property-value').text(rotY.toFixed(0) + '°');
        $('#rotation-z').next('.property-value').text(rotZ.toFixed(0) + '°');

        // Update scale inputs
        $('#scale-x').val(object.scale.x.toFixed(2));
        $('#scale-y').val(object.scale.y.toFixed(2));
        $('#scale-z').val(object.scale.z.toFixed(2));

        // Update material properties
        let materialColor = '#ffffff';
        let materialId = 'none';

        // Find the first mesh with a material
        object.traverse((child) => {
            if (child.isMesh && child.material) {
                if (child.material.color) {
                    materialColor = '#' + child.material.color.getHexString();
                }

                if (child.userData.materialId) {
                    materialId = child.userData.materialId;
                }
            }
        });

        $('#object-color').val(materialColor);
        $('#object-material').val(materialId);

        // Disable certain controls for van models
        if (object.userData.isVan) {
            $('#duplicate-object, #remove-object').prop('disabled', true);
        } else {
            $('#duplicate-object, #remove-object').prop('disabled', false);
        }
    }

    clearObjectProperties() {
        // Hide property groups
        $('.property-group, .property-actions').hide();
        $('.no-selection-message').show();
    }

    openSaveModal() {
        $('#save-design-modal').show();
    }

    openLoadModal() {
        $('#load-design-modal').show();
    }
}
})(jQuery);
