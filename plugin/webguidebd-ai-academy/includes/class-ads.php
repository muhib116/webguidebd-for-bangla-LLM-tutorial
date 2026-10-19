<?php
/**
 * AdSense preparation — disabled until configured.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Ads {

	public static function register(): void {
		// No ad requests while disabled.
	}

	public static function is_enabled(): bool {
		$settings = get_option( 'wgba_settings', array() );
		if ( empty( $settings['ads_enabled'] ) ) {
			return false;
		}
		$pub = (string) ( $settings['ads_publisher_id'] ?? '' );
		return (bool) preg_match( '/^ca-pub-\d+$/', $pub );
	}

	/**
	 * Reserved for future placements — returns empty when disabled.
	 */
	public static function render_slot( string $placement ): string {
		if ( ! self::is_enabled() ) {
			return '';
		}
		// Exclusions: account, dashboard, playground, login-only.
		$route = (string) get_query_var( 'wgba_route' );
		$deny  = array( 'dashboard', 'login', 'register', 'notes', 'questions', 'profile', 'bookmarks' );
		if ( in_array( $route, $deny, true ) ) {
			return '';
		}
		// Real ad markup only with validated IDs — intentionally not emitting network tags until owner confirms consent path.
		return '<!-- wgba ads: configured but consent/activation gate pending; no request issued -->';
	}
}
