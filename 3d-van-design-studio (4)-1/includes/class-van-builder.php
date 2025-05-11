<?php
/**
 * Main class for the van builder functionality
 */
class Van_Builder {
    
    public function __construct() {
        // Register AJAX handlers
        add_action('wp_ajax_save_van_design', array($this, 'save_van_design'));
        add_action('wp_ajax_load_van_design', array($this, 'load_van_design'));
        add_action('wp_ajax_delete_van_design', array($this, 'delete_van_design'));
        
        // Non-authenticated users can view designs but not save
        add_action('wp_ajax_nopriv_load_van_design', array($this, 'load_van_design'));
        
        // Add custom CSS for transform controls and keyboard shortcuts
        add_action('wp_head', array($this, 'add_custom_css'));
    }
    
    /**
     * Add custom CSS for transform controls and keyboard shortcuts
     */
    public function add_custom_css() {
        // Only add on pages with our shortcode
        global $post;
        if (!is_a($post, 'WP_Post') || !has_shortcode($post->post_content, 'van_builder')) {
            return;
        }
        
        ?>
        <style>
            .transform-controls-buttons {
                position: absolute;
                top: 10px;
                left: 10px;
                z-index: 100;
                display: flex;
                gap: 5px;
            }

            .transform-button {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: rgba(255, 255, 255, 0.8);
                border: 2px solid #ccc;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .transform-button:hover {
                background-color: rgba(255, 255, 255, 1);
                border-color: #999;
            }

            .transform-button.active {
                background-color: #0073aa;
                border-color: #005177;
                color: white;
            }

            .transform-button .dashicons {
                font-size: 20px;
            }
            
            .keyboard-shortcuts {
                position: absolute;
                bottom: 10px;
                right: 10px;
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-size: 14px;
                z-index: 100;
            }

            .keyboard-shortcuts .shortcut {
                margin: 5px 0;
                display: flex;
                align-items: center;
            }

            .keyboard-shortcuts .key {
                display: inline-block;
                background-color: #444;
                border: 1px solid #666;
                border-radius: 3px;
                padding: 2px 6px;
                margin-right: 8px;
                font-family: monospace;
                font-weight: bold;
                min-width: 20px;
                text-align: center;
            }
        </style>
        <?php
    }
    
    /**
     * Render the shortcode output
     */
    public static function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'width' => '100%',
            'height' => '600px',
            'default_van' => 'sprinter',
            'show_controls' => 'true',
            'allow_save' => 'true',
        ), $atts);
        
        ob_start();
        ?>
        <div class="van-builder-container" data-default-van="<?php echo esc_attr($atts['default_van']); ?>" style="width: <?php echo esc_attr($atts['width']); ?>; height: <?php echo esc_attr($atts['height']); ?>; position: relative;">
            <?php if ($atts['show_controls'] === 'true'): ?>
            <div class="van-builder-toolbar">
                <button id="van-builder-undo" class="van-builder-toolbar-button" title="Undo">
                    <span class="dashicons dashicons-undo"></span>
                </button>
                <button id="van-builder-redo" class="van-builder-toolbar-button" title="Redo">
                    <span class="dashicons dashicons-redo"></span>
                </button>
                <button id="van-builder-reset-view" class="van-builder-toolbar-button" title="Reset View">
                    <span class="dashicons dashicons-image-rotate"></span>
                </button>
                <button id="van-builder-toggle-grid" class="van-builder-toolbar-button" title="Toggle Grid">
                    <span class="dashicons dashicons-grid-view"></span>
                </button>
                <button id="van-builder-toggle-measurements" class="van-builder-toolbar-button" title="Toggle Measurements">
                    <span class="dashicons dashicons-editor-code"></span>
                </button>
                <?php if ($atts['allow_save'] === 'true' && is_user_logged_in()): ?>
                <button id="van-builder-save" class="van-builder-toolbar-button" title="Save Design">
                    <span class="dashicons dashicons-saved"></span>
                </button>
                <button id="van-builder-load" class="van-builder-toolbar-button" title="Load Design">
                    <span class="dashicons dashicons-download"></span>
                </button>
                <?php endif; ?>
                <button id="van-builder-screenshot" class="van-builder-toolbar-button" title="Take Screenshot">
                    <span class="dashicons dashicons-camera"></span>
                </button>
                <button id="van-builder-fullscreen" class="van-builder-toolbar-button" title="Toggle Fullscreen">
                    <span class="dashicons dashicons-fullscreen-alt"></span>
                </button>
            </div>
            <?php endif; ?>
            
            <!-- Transform controls buttons -->
            <div class="transform-controls-buttons">
                <button id="transform-translate" class="transform-button active" title="Move (G)">
                    <span class="dashicons dashicons-move"></span>
                </button>
                <button id="transform-rotate" class="transform-button" title="Rotate (R)">
                    <span class="dashicons dashicons-image-rotate"></span>
                </button>
                <button id="transform-scale" class="transform-button" title="Scale (S)">
                    <span class="dashicons dashicons-editor-expand"></span>
                </button>
            </div>
            
            
            <div id="van-3d-canvas"></div>
            
            <div class="van-builder-sidebar">
                <div class="van-builder-accordion">
                    <div class="van-builder-accordion-header">Van Models</div>
                    <div class="van-builder-accordion-content">
                        <div id="van-models-container" class="van-builder-model-selector"></div>
                    </div>
                    
                    <div class="van-builder-accordion-header">Furniture</div>
                    <div class="van-builder-accordion-content">
                        <div class="van-builder-category-tabs">
                            <div class="category-tab active" data-category="kitchen">Kitchen</div>
                            <div class="category-tab" data-category="sleeping">Sleeping</div>
                            <div class="category-tab" data-category="storage">Storage</div>
                            <div class="category-tab" data-category="bathroom">Bathroom</div>
                        </div>
                        
                        <div class="category-items-container">
                            <div class="category-items" data-category="kitchen"></div>
                            <div class="category-items" data-category="sleeping" style="display: none;"></div>
                            <div class="category-items" data-category="storage" style="display: none;"></div>
                            <div class="category-items" data-category="bathroom" style="display: none;"></div>
                        </div>
                    </div>
                    
                    <div class="van-builder-accordion-header">Materials</div>
                    <div class="van-builder-accordion-content">
                        <div id="materials-container" class="van-builder-material-selector"></div>
                    </div>
                    
                    <div class="van-builder-accordion-header">Properties</div>
                    <div class="van-builder-accordion-content">
                        <div class="no-selection-message">Select an object to edit its properties</div>
                        
                        <div class="property-group position-group">
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
                        
                        <div class="property-group rotation-group">
                            <h4>Rotation</h4>
                            <div class="property-row">
                                <label for="rotation-x">X:</label>
                                <input type="range" id="rotation-x" min="0" max="360" step="1">
                                <span class="property-value">0°</span>
                            </div>
                            <div class="property-row">
                                <label for="rotation-y">Y:</label>
                                <input type="range" id="rotation-y" min="0" max="360" step="1">
                                <span class="property-value">0°</span>
                            </div>
                            <div class="property-row">
                                <label for="rotation-z">Z:</label>
                                <input type="range" id="rotation-z" min="0" max="360" step="1">
                                <span class="property-value">0°</span>
                            </div>
                        </div>
                        
                        <div class="property-group scale-group">
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
                        
                        <div class="property-group material-group">
                            <h4>Material</h4>
                            <div class="property-row">
                                <label for="object-color">Color:</label>
                                <input type="color" id="object-color" value="#ffffff">
                            </div>
                            <div class="property-row">
                                <label for="object-material">Material:</label>
                                <select id="object-material">
                                    <option value="none">None</option>
                                    <!-- Materials will be added dynamically -->
                                </select>
                            </div>
                        </div>
                        
                        <div class="property-actions">
                            <button id="duplicate-object" class="van-builder-button">Duplicate</button>
                            <button id="remove-object" class="van-builder-button">Remove</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Save Design Modal -->
            <div id="save-design-modal" class="van-builder-modal">
                <div class="van-builder-modal-content">
                    <span class="van-builder-modal-close">&times;</span>
                    <h3>Save Design</h3>
                    <form id="save-design-form">
                        <div class="form-row">
                            <label for="design-name">Design Name:</label>
                            <input type="text" id="design-name" required>
                        </div>
                        <input type="hidden" id="design-id" value="">
                        <button type="submit" class="van-builder-button">Save</button>
                    </form>
                </div>
            </div>
            
            <!-- Load Design Modal -->
            <div id="load-design-modal" class="van-builder-modal">
                <div class="van-builder-modal-content">
                    <span class="van-builder-modal-close">&times;</span>
                    <h3>Load Design</h3>
                    <div class="saved-designs-list">
                        <?php
                        if (is_user_logged_in()) {
                            global $wpdb;
                            $table_name = $wpdb->prefix . 'van_builder_saved_designs';
                            $user_id = get_current_user_id();
                            
                            $designs = $wpdb->get_results(
                                $wpdb->prepare(
                                    "SELECT * FROM $table_name WHERE user_id = %d ORDER BY updated_at DESC",
                                    $user_id
                                )
                            );
                            
                            if ($designs) {
                                foreach ($designs as $design) {
                                    ?>
                                    <div class="saved-design-item" data-design-id="<?php echo esc_attr($design->id); ?>">
                                        <span class="design-name"><?php echo esc_html($design->design_name); ?></span>
                                        <span class="design-date"><?php echo esc_html(date('M j, Y', strtotime($design->updated_at))); ?></span>
                                        <div class="design-actions">
                                            <button class="load-design-button van-builder-button">Load</button>
                                            <button class="delete-design-button van-builder-button">Delete</button>
                                        </div>
                                    </div>
                                    <?php
                                }
                            } else {
                                echo '<p>You don\'t have any saved designs yet.</p>';
                            }
                        } else {
                            echo '<p>Please log in to save and load designs.</p>';
                        }
                        ?>
                    </div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Save a van design
     */
    public function save_van_design() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'van_builder_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
        }
        
        // Check if user is logged in
        if (!is_user_logged_in()) {
            wp_send_json_error(array('message' => 'You must be logged in to save designs'));
        }
        
        $user_id = get_current_user_id();
        $design_name = sanitize_text_field($_POST['design_name']);
        $design_data = $_POST['design_data']; // This is JSON data
        $design_id = isset($_POST['design_id']) ? intval($_POST['design_id']) : 0;
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'van_builder_saved_designs';
        
        if ($design_id > 0) {
            // Update existing design
            $result = $wpdb->update(
                $table_name,
                array(
                    'design_name' => $design_name,
                    'design_data' => $design_data,
                    'updated_at' => current_time('mysql')
                ),
                array('id' => $design_id, 'user_id' => $user_id),
                array('%s', '%s', '%s'),
                array('%d', '%d')
            );
            
            if ($result === false) {
                wp_send_json_error(array('message' => 'Failed to update design'));
            }
        } else {
            // Insert new design
            $result = $wpdb->insert(
                $table_name,
                array(
                    'user_id' => $user_id,
                    'design_name' => $design_name,
                    'design_data' => $design_data,
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ),
                array('%d', '%s', '%s', '%s', '%s')
            );
            
            if ($result === false) {
                wp_send_json_error(array('message' => 'Failed to save design'));
            }
            
            $design_id = $wpdb->insert_id;
        }
        
        wp_send_json_success(array(
            'message' => 'Design saved successfully',
            'design_id' => $design_id
        ));
    }
    
    /**
     * Load a van design
     */
    public function load_van_design() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'van_builder_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
        }
        
        $design_id = isset($_POST['design_id']) ? intval($_POST['design_id']) : 0;
        
        if ($design_id <= 0) {
            wp_send_json_error(array('message' => 'Invalid design ID'));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'van_builder_saved_designs';
        
        $design = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE id = %d",
                $design_id
            )
        );
        
        if (!$design) {
            wp_send_json_error(array('message' => 'Design not found'));
        }
        
        // Check if current user owns this design or if it's public
        if (is_user_logged_in() && $design->user_id != get_current_user_id()) {
            // Check if design is shared publicly
            $is_public = get_post_meta($design_id, 'van_builder_design_public', true);
            if (!$is_public) {
                wp_send_json_error(array('message' => 'You do not have permission to view this design'));
            }
        }
        
        wp_send_json_success(array(
            'design' => $design
        ));
    }
    
    /**
     * Delete a van design
     */
    public function delete_van_design() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'van_builder_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
        }
        
        // Check if user is logged in
        if (!is_user_logged_in()) {
            wp_send_json_error(array('message' => 'You must be logged in to delete designs'));
        }
        
        $user_id = get_current_user_id();
        $design_id = isset($_POST['design_id']) ? intval($_POST['design_id']) : 0;
        
        if ($design_id <= 0) {
            wp_send_json_error(array('message' => 'Invalid design ID'));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'van_builder_saved_designs';
        
        $result = $wpdb->delete(
            $table_name,
            array('id' => $design_id, 'user_id' => $user_id),
            array('%d', '%d')
        );
        
        if ($result === false) {
            wp_send_json_error(array('message' => 'Failed to delete design'));
        }
        
        wp_send_json_success(array(
            'message' => 'Design deleted successfully'
        ));
    }
}
