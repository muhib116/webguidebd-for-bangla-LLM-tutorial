<?php
/**
 * Main plugin bootstrap.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Plugin {

	/** @var self|null */
	private static $instance = null;

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	public function init(): void {
		load_plugin_textdomain( 'webguidebd-ai-academy', false, dirname( plugin_basename( WGBA_PLUGIN_FILE ) ) . '/languages' );

		add_action( 'init', array( Schema::class, 'maybe_upgrade' ), 5 );
		add_action( 'init', array( Post_Types::class, 'register' ), 5 );
		add_action( 'init', array( Rewrite::class, 'add_rules' ), 6 );

		Rewrite::register();
		Access::register_hooks();
		Assets::register();
		REST_API::register();
		Auth_Frontend::register();
		Templates::register();
		SEO::register();
		PWA::register();
		Privacy::register();
		Admin::register();
		Ads::register();
		Tutor::register();
		Personal_Data::register();

		// Seed only in admin, on demand / one-shot — never on front requests.
		add_action( 'admin_init', array( Content_Seeder::class, 'maybe_admin_seed' ), 20 );
		// Re-grant caps after ZIP replace without deactivating the plugin.
		add_action( 'admin_init', array( Capabilities::class, 'install_roles' ), 5 );
		add_action( 'admin_init', array( self::class, 'maybe_flush_rewrites' ), 6 );
	}

	/**
	 * Flush pretty routes once per version (contact/about rules, etc.).
	 */
	public static function maybe_flush_rewrites(): void {
		if ( (string) get_option( 'wgba_rewrite_version', '' ) === WGBA_VERSION ) {
			return;
		}
		Rewrite::add_rules();
		flush_rewrite_rules( false );
		self::migrate_settings_on_version();
		update_option( 'wgba_rewrite_version', WGBA_VERSION, false );
	}

	/**
	 * One-shot setting fixes when the plugin version changes.
	 */
	private static function migrate_settings_on_version(): void {
		$settings = get_option( 'wgba_settings', array() );
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}
		$dirty = false;
		$phone = preg_replace( '/\D+/', '', (string) ( $settings['author_phone'] ?? '' ) );
		$stale = array( '01766461773', '1766461773', '8801766461773' );
		if ( '' === $phone || in_array( (string) $phone, $stale, true ) ) {
			$settings['author_phone'] = '01770989591';
			$dirty                   = true;
		}
		// Prefer the bundled founder portrait shipped in this release.
		if ( ! empty( $settings['author_photo_id'] ) ) {
			$settings['author_photo_id'] = 0;
			$dirty                       = true;
		}
		if ( $dirty ) {
			update_option( 'wgba_settings', $settings, false );
		}
	}
}
