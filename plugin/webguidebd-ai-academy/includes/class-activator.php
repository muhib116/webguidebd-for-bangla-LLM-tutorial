<?php
/**
 * Activation: capabilities, tables, rewrite flush.
 * Heavy curriculum seed is deferred (admin-triggered) to avoid timeouts.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Activator {

	/**
	 * Run on plugin activation — keep this light.
	 */
	public static function activate(): void {
		Capabilities::install_roles();
		Schema::install();
		Post_Types::register();
		Rewrite::add_rules();
		flush_rewrite_rules();

		if ( false === get_option( 'wgba_public_preview_chapters', false ) ) {
			update_option(
				'wgba_public_preview_chapters',
				array( 'ch-01-ai-llm-intro', 'ch-02-js-fundamentals' ),
				false
			);
		}

		$defaults = array(
			'author_display_name' => 'Muhibbullah Ansary',
			'author_bio'          => '',
			'author_photo_id'     => 0,
			'author_social'       => array(),
			'ads_enabled'         => false,
			'tutor_enabled'       => false,
			'analytics_enabled'   => false,
		);
		if ( false === get_option( 'wgba_settings', false ) ) {
			update_option( 'wgba_settings', $defaults, false );
		}

		update_option( 'wgba_db_version', WGBA_DB_VERSION, false );
		update_option( 'wgba_activated_at', gmdate( 'c' ), false );
		// Do not seed full lessons here — shared hosts often hit time/memory limits.
		update_option( 'wgba_needs_seed', 1, false );
	}
}
