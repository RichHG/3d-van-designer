<?php
/**
 * Class for managing plugin assets
 */
class Van_Builder_Assets {

    public function __construct() { // Add constructor
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_assets'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
    }
    
    public function enqueue_frontend_assets() {
        global $post;

        // Check for shortcode existence *before* enqueueing scripts
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'van_builder')) {
            // Enqueue scripts and styles in the correct order with dependencies
            wp_enqueue_script('jquery'); // Ensure jQuery is loaded first

            // Three.js and dependencies
            wp_enqueue_script('threejs', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', array('jquery'), null, true);
            wp_enqueue_script('orbit-controls', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js', array('threejs'), null, true);
            wp_enqueue_script('transform-controls', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/TransformControls.js', array('threejs'), null, true);
            wp_enqueue_script('gltf-loader', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js', array('threejs'), null, true);
            wp_enqueue_script('draco-loader', 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js', array('threejs'), null, true);


            // Component scripts (order is important)
wp_enqueue_script('scene-manager', VAN_BUILDER_ASSETS_URL . 'js/components/scene-manager.js', array('threejs', 'orbit-controls', 'transform-controls'), VAN_BUILDER_VERSION, true);
wp_enqueue_script('model-loader', VAN_BUILDER_ASSETS_URL . 'js/components/model-loader.js', array('threejs', 'gltf-loader', 'draco-loader'), VAN_BUILDER_VERSION, true);
wp_enqueue_script('interaction-manager', VAN_BUILDER_ASSETS_URL . 'js/components/interaction-manager.js', array('threejs', 'transform-controls'), VAN_BUILDER_VERSION, true);
wp_enqueue_script('ui-controls', VAN_BUILDER_ASSETS_URL . 'js/components/ui-controls.js', array('jquery'), VAN_BUILDER_VERSION, true);

// Main script (loaded last)
wp_enqueue_script('van-builder-js', VAN_BUILDER_ASSETS_URL . 'js/van-builder.js', array(
    'jquery', 'threejs', 'scene-manager', 'model-loader', 'interaction-manager', 'ui-controls'
), VAN_BUILDER_VERSION, true);

           // In class-assets.php, modify the wp_localize_script call:
wp_localize_script('van-builder-js', 'vanBuilderData', array(
    'pluginUrl' => VAN_BUILDER_PLUGIN_URL,
    'modelsUrl' => VAN_BUILDER_MODELS_URL,
    'assetsUrl' => VAN_BUILDER_ASSETS_URL, // Add this line
    'ajaxUrl' => admin_url('admin-ajax.php'),
    'nonce' => wp_create_nonce('van_builder_nonce'),
    'availableModels' => Van_Builder_Models::get_available_models()
));

            // Styles
            wp_enqueue_style('van-builder', VAN_BUILDER_ASSETS_URL . 'css/van-builder.css', array(), VAN_BUILDER_VERSION);
        }
    }

    public function enqueue_admin_assets($hook) {
        // Only load on plugin admin pages
        if (strpos($hook, 'van-builder') === false) {
            return;
        }
        
        wp_enqueue_media();
        wp_enqueue_script('van-builder-admin', VAN_BUILDER_ASSETS_URL . 'js/admin-scripts.js', array('jquery'), VAN_BUILDER_VERSION, true);
        wp_enqueue_style('van-builder-admin', VAN_BUILDER_ASSETS_URL . 'css/admin-styles.css', array(), VAN_BUILDER_VERSION);
    }
}
