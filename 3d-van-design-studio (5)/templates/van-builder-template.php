<?php
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get settings
$options = get_option('van_builder_general_settings', array());
$width = isset($atts['width']) ? $atts['width'] : (isset($options['canvas_width']) ? $options['canvas_width'] : '100%');
$height = isset($atts['height']) ? $atts['height'] : (isset($options['canvas_height']) ? $options['canvas_height'] : '700px');
$default_van = isset($atts['default_van']) ? $atts['default_van'] : (isset($options['default_van_model']) ? $options['default_van_model'] : 'sprinter');
$show_controls = isset($atts['show_controls']) ? filter_var($atts['show_controls'], FILTER_VALIDATE_BOOLEAN) : true;
?>
<!-- Right Sidebar -->
<div class="van-builder-sidebar">
    <!-- Categories Navigation -->
    <div class="sidebar-header">
        <div class="category-tabs">
            <div class="category-tab active" data-category="van-models">
                <span class="dashicons dashicons-car"></span> Vans
            </div>
            <div class="category-tab" data-category="kitchen">
                <span class="dashicons dashicons-kitchen"></span> Kitchen
            </div>
            <div class="category-tab" data-category="sleeping">
                <span class="dashicons dashicons-bed"></span> Sleeping
            </div>
            <div class="category-tab" data-category="storage">
                <span class="dashicons dashicons-archive"></span> Storage
            </div>
            <div class="category-tab" data-category="bathroom">
                <span class="dashicons dashicons-water"></span> Bathroom
            </div>
        </div>
    </div>

    <!-- Scrollable Content Area -->
    <div class="sidebar-content">
        <!-- Dynamic Category Content - Populated by class-van-models.php -->
        <div class="category-items" data-category="van-models"></div>
        <div class="category-items" data-category="kitchen" style="display: none;"></div>
        <div class="category-items" data-category="sleeping" style="display: none;"></div>
        <div class="category-items" data-category="storage" style="display: none;"></div>
        <div class="category-items" data-category="bathroom" style="display: none;"></div>

        <!-- Properties Panel -->
        <div class="properties-section">
            <div class="no-selection-message">
                <span class="dashicons dashicons-info"></span>
                <p>Select an object to edit its properties</p>
            </div>
            
            <div class="properties-content" style="display: none;">
                <!-- Position -->
                <div class="property-group">
                    <h4><span class="dashicons dashicons-move"></span> Position</h4>
                    <div class="property-row">
                        <span class="property-label">X:</span>
                        <input type="number" id="position-x" class="property-input" step="0.1">
                    </div>
                    <div class="property-row">
                        <span class="property-label">Y:</span>
                        <input type="number" id="position-y" class="property-input" step="0.1">
                    </div>
                    <div class="property-row">
                        <span class="property-label">Z:</span>
                        <input type="number" id="position-z" class="property-input" step="0.1">
                    </div>
                </div>

                <!-- Rotation -->
                <div class="property-group">
                    <h4><span class="dashicons dashicons-image-rotate"></span> Rotation</h4>
                    <div class="property-row">
                        <span class="property-label">X:</span>
                        <input type="range" id="rotation-x" min="0" max="360" value="0">
                        <span class="property-value">0°</span>
                    </div>
                    <div class="property-row">
                        <span class="property-label">Y:</span>
                        <input type="range" id="rotation-y" min="0" max="360" value="0">
                        <span class="property-value">0°</span>
                    </div>
                    <div class="property-row">
                        <span class="property-label">Z:</span>
                        <input type="range" id="rotation-z" min="0" max="360" value="0">
                        <span class="property-value">0°</span>
                    </div>
                </div>

                <!-- Scale -->
                <div class="property-group">
                    <h4><span class="dashicons dashicons-editor-expand"></span> Scale</h4>
                    <div class="property-row">
                        <label class="property-label" for="scale-uniform">
                            <input type="checkbox" id="scale-uniform" checked>
                            Uniform
                        </label>
                    </div>
                    <div class="property-row">
                        <span class="property-label">X:</span>
                        <input type="number" id="scale-x" class="property-input" step="0.1" value="1">
                    </div>
                    <div class="property-row scale-non-uniform" style="display: none;">
                        <span class="property-label">Y:</span>
                        <input type="number" id="scale-y" class="property-input" step="0.1" value="1">
                    </div>
                    <div class="property-row scale-non-uniform" style="display: none;">
                        <span class="property-label">Z:</span>
                        <input type="number" id="scale-z" class="property-input" step="0.1" value="1">
                    </div>
                </div>

                <!-- Actions -->
                <div class="property-actions">
                    <button id="duplicate-object" class="van-builder-button">
                        <span class="dashicons dashicons-admin-page"></span>
                        Duplicate
                    </button>
                    <button id="remove-object" class="van-builder-button danger">
                        <span class="dashicons dashicons-trash"></span>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

    <!-- Loading Indicator -->
    <div class="van-builder-loading" style="display: none;">
        <div class="van-builder-loading-spinner"></div>
        <div class="van-builder-loading-text">Loading...</div>
    </div>
</div>