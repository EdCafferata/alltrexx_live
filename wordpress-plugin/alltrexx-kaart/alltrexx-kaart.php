<?php
/**
 * Plugin Name: Alltrexx Live Kaart
 * Description: Embed de Alltrexx live tracking kaart via shortcode [alltrexx_kaart]
 * Version:     1.0.0
 * Author:      Ed Cafferata
 * Author URI:  https://alltrexx.live
 */

defined('ABSPATH') || exit;

/**
 * Shortcode: [alltrexx_kaart hoogte="600" api="https://alltrexx.live"]
 * Voeg toe aan elke pagina of post.
 */
function alltrexx_kaart_shortcode($atts) {
    $atts = shortcode_atts([
        'hoogte' => '600',
        'breedte' => '100%',
        'api'    => get_option('alltrexx_api_url', 'http://localhost:8080'),
    ], $atts, 'alltrexx_kaart');

    $hoogte  = esc_attr($atts['hoogte']);
    $breedte = esc_attr($atts['breedte']);
    $api_url = esc_url($atts['api']);

    // Laad de Leaflet assets
    wp_enqueue_style(
        'leaflet',
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        [], '1.9.4'
    );
    wp_enqueue_script(
        'leaflet',
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        [], '1.9.4', true
    );
    wp_enqueue_script(
        'alltrexx-kaart',
        plugin_dir_url(__FILE__) . 'kaart.js',
        ['leaflet'], '1.0.0', true
    );

    $kaart_id = 'alltrexx-kaart-' . uniqid();

    return sprintf(
        '<div id="%s" style="height:%spx; width:%s; border-radius:8px; overflow:hidden;"
              data-api="%s"></div>',
        $kaart_id, $hoogte, $breedte, $api_url
    );
}
add_shortcode('alltrexx_kaart', 'alltrexx_kaart_shortcode');

/**
 * Instellingen pagina in WordPress admin
 */
function alltrexx_admin_menu() {
    add_options_page(
        'Alltrexx Live',
        'Alltrexx Live',
        'manage_options',
        'alltrexx-live',
        'alltrexx_settings_page'
    );
}
add_action('admin_menu', 'alltrexx_admin_menu');

function alltrexx_settings_page() {
    if (isset($_POST['alltrexx_api_url'])) {
        update_option('alltrexx_api_url', sanitize_url($_POST['alltrexx_api_url']));
        echo '<div class="updated"><p>Instellingen opgeslagen.</p></div>';
    }
    $api_url = get_option('alltrexx_api_url', 'http://localhost:8080');
    ?>
    <div class="wrap">
        <h1>⚓ Alltrexx Live instellingen</h1>
        <form method="post">
            <table class="form-table">
                <tr>
                    <th>API URL</th>
                    <td>
                        <input type="url" name="alltrexx_api_url"
                               value="<?php echo esc_attr($api_url); ?>"
                               class="regular-text"
                               placeholder="https://alltrexx.live" />
                        <p class="description">URL van de Alltrexx Live backend API.</p>
                    </td>
                </tr>
            </table>
            <p><submit-button>Opslaan</submit-button>
            <?php submit_button('Opslaan'); ?>
        </form>
        <h2>Gebruik</h2>
        <p>Voeg de kaart in op een pagina of post met:</p>
        <code>[alltrexx_kaart hoogte="600"]</code>
        <p>Of met aangepaste API URL:</p>
        <code>[alltrexx_kaart hoogte="500" api="https://alltrexx.live"]</code>
    </div>
    <?php
}
