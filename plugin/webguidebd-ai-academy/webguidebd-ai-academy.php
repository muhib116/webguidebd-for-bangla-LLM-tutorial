<?php
/**
 * Plugin Name:       WebGuideBD AI Academy
 * Plugin URI:        https://webguidebd.site/ai-academy/
 * Description:       Bengali AI & LLM learning platform — curriculum, access control, progress, and safe JS playground.
 * Version:           0.1.31
 * Requires at least: 6.4
 * Requires PHP:      8.1
 * Author:            Muhibbullah Ansary
 * Author URI:        https://webguidebd.site/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       webguidebd-ai-academy
 * Domain Path:       /languages
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WGBA_VERSION', '0.1.31' );
define( 'WGBA_PLUGIN_FILE', __FILE__ );
define( 'WGBA_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'WGBA_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'WGBA_DB_VERSION', '1.0.0' );
define( 'WGBA_CONTENT_SCHEMA', '1.0.0' );

require_once WGBA_PLUGIN_DIR . 'includes/class-autoloader.php';
WGBA\Autoloader::register();

register_activation_hook( __FILE__, array( 'WGBA\\Activator', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'WGBA\\Deactivator', 'deactivate' ) );

add_action(
	'plugins_loaded',
	static function (): void {
		WGBA\Plugin::instance()->init();
	}
);
