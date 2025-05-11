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

<div class="van-builder-container" style="width: <?php echo esc_attr($width); ?>; height: <?php echo esc_attr($height); ?>;" data-default-van="<?php echo esc_attr($default_van); ?>">
    <!-- Toolbar -->
    <div class="van-builder-toolbar">
        <div class="van-builder-toolbar-section">
            <button id="van-builder-undo" class="van-builder-button" title="Undo">
                <span class="dashicons dashicons-undo"></span>
            </button>
            <button id="van-builder-redo" class="van-builder-button" title="Redo">
                <span class="dashicons dashicons-redo"></span>
            </button>
        </div>

        <div class="van-builder-toolbar-section">
            <button id="van-builder-reset-view" class="van-builder-button" title="Reset View">
                <span class="dashicons dashicons-image-rotate"></span>
            </button>
            <button id="van-builder-toggle-grid" class="van-builder-button" title="Toggle Grid">
                <span class="dashicons dashicons-grid-view"></span>
            </button>
            <button id="van-builder-toggle-measurements" class="van-builder-button" title="Toggle Measurements">
                <span class="dashicons dashicons-editor-code"></span>
            </button>
        </div>

        <div class="van-builder-toolbar-section">
            <button id="van-builder-save" class="van-builder-button" title="Save Design">
                <span class="dashicons dashicons-saved"></span>
                Save
            </button>
            <button id="van-builder-load" class="van-builder-button" title="Load Design">
                <span class="dashicons dashicons-download"></span>
                Load
            </button>
        </div>

        <div class="van-builder-toolbar-section">
            <button id="van-builder-screenshot" class="van-builder-button" title="Take Screenshot">
                <span class="dashicons dashicons-camera"></span>
            </button>
            <button id="van-builder-fullscreen" class="van-builder-button" title="Toggle Fullscreen">
                <span class="dashicons dashicons-fullscreen-alt"></span>
            </button>
        </div>
    </div>

    <!-- Main workspace -->
    <div class="van-builder-workspace">
        <!-- Transform Controls -->
        <div class="transform-controls-buttons">
            <button id="transform-translate" class="transform-button active" title="Move">
                <span class="dashicons dashicons-move"></span>
            </button>
            <button id="transform-rotate" class="transform-button" title="Rotate">
                <span class="dashicons dashicons-image-rotate"></span>
            </button>
            <button id="transform-scale" class="transform-button" title="Scale">
                <span class="dashicons dashicons-editor-expand"></span>
            </button>
        </div>

        <!-- 3D Canvas -->
        <div id="van-3d-canvas"></div>

        <!-- Right Sidebar -->
        <div class="van-builder-sidebar">
            <!-- Categories -->
            <div class="van-builder-category-tabs">
                <div class="category-tab active" data-category="van-models">Van Models</div>
                <div class="category-tab" data-category="kitchen">Kitchen</div>
                <div class="category-tab" data-category="sleeping">Sleeping</div>
                <div class="category-tab" data-category="storage">Storage</div>
                <div class="category-tab" data-category="bathroom">Bathroom</div>
            </div>

            <!-- Category Content -->
            <div class="van-builder-category-content">
                <!-- Van Models -->
                <div class="category-items" data-category="van-models"></div>
                
                <!-- Furniture Categories -->
                <div class="category-items" data-category="kitchen" style="display: none;"></div>
                <div class="category-items" data-category="sleeping" style="display: none;"></div>
                <div class="category-items" data-category="storage" style="display: none;"></div>
                <div class="category-items" data-category="bathroom" style="display: none;"></div>
            </div>

            <!-- Properties Panel -->
            <div class="van-builder-properties">
                <div class="no-selection-message">Select an object to edit its properties</div>
                
                <!-- Position -->
                <div class="property-group" style="display: none;">
                    <h4>Position</h4>
                    <div class="property-row">
                        <label for="position-x">X:</label>
                        <input type="number" id="position-x" step="0.1">
                    </div>
                    <div class="property-row">
                        <label for="position-y">Y:</label>
                        <input type="number" id="position-y" step="0.1">
                    </div>
                    <div class="property-row">
                        <label for="position-z">Z:</label>
                        <input type="number" id="position-z" step="0.1">
                    </div>
                </div>

                <!-- Rotation -->
                <div class="property-group" style="display: none;">
                    <h4>Rotation</h4>
                    <div class="property-row">
                        <label for="rotation-x">X:</label>
                        <input type="range" id="rotation-x" min="0" max="360" value="0">
                        <span class="property-value">0°</span>
                    </div>
                    <div class="property-row">
                        <label for="rotation-y">Y:</label>
                        <input type="range" id="rotation-y" min="0" max="360" value="0">
                        <span class="property-value">0°</span>
                    </div>
                    <div class="property-row">
                        <label for="rotation-z">Z:</label>
                        <input type="range" id="rotation-z" min="0" max="360" value="0">
                        <span class="property-value">0°</span>
                    </div>
                </div>

                <!-- Scale -->
                <div class="property-group" style="display: none;">
                    <h4>Scale</h4>
                    <div class="property-row">
                        <label for="scale-uniform">Uniform:</label>
                        <input type="checkbox" id="scale-uniform" checked>
                    </div>
                    <div class="property-row">
                        <label for="scale-x">X:</label>
                        <input type="number" id="scale-x" step="0.1" value="1">
                    </div>
                    <div class="property-row scale-non-uniform" style="display: none;">
                        <label for="scale-y">Y:</label>
                        <input type="number" id="scale-y" step="0.1" value="1">
                    </div>
                    <div class="property-row scale-non-uniform" style="display: none;">
                        <label for="scale-z">Z:</label>
                        <input type="number" id="scale-z" step="0.1" value="1">
                    </div>
                </div>

                <!-- Actions -->
                <div class="property-actions" style="display: none;">
                    <button id="duplicate-object" class="van-builder-button">Duplicate</button>
                    <button id="remove-object" class="van-builder-button">Delete</button>
                </div>
            </div>
        </div>
    </div>
</div>
