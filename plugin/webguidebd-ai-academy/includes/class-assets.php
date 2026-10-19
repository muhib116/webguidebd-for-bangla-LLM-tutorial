<?php
/**
 * Route-scoped assets.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Assets {

	public static function register(): void {
		add_action( 'wp_enqueue_scripts', array( self::class, 'strip_theme_assets' ), 100 );
		add_action( 'wp_print_styles', array( self::class, 'strip_theme_assets' ), 100 );
		add_action( 'wp_print_scripts', array( self::class, 'strip_theme_scripts' ), 100 );
	}

	/**
	 * Academy routes use standalone chrome — drop theme/Elementor CSS that overrides links.
	 */
	public static function strip_theme_assets(): void {
		if ( ! get_query_var( 'wgba_route' ) ) {
			return;
		}

		global $wp_styles;
		if ( ! $wp_styles instanceof \WP_Styles ) {
			return;
		}

		$keep = array( 'wgba-academy', 'wgba-fonts', 'admin-bar', 'dashicons' );
		foreach ( (array) $wp_styles->queue as $handle ) {
			if ( in_array( $handle, $keep, true ) || 0 === strpos( (string) $handle, 'wgba-' ) ) {
				continue;
			}
			wp_dequeue_style( $handle );
		}
	}

	/**
	 * Keep only academy front scripts on academy routes.
	 */
	public static function strip_theme_scripts(): void {
		if ( ! get_query_var( 'wgba_route' ) ) {
			return;
		}

		global $wp_scripts;
		if ( ! $wp_scripts instanceof \WP_Scripts ) {
			return;
		}

		$keep = array(
			'wgba-frontend',
			'wgba-playground-host',
			'admin-bar',
			'hoverintent-js',
			'jquery',
			'jquery-core',
			'jquery-migrate',
		);
		foreach ( (array) $wp_scripts->queue as $handle ) {
			if ( in_array( $handle, $keep, true ) || 0 === strpos( (string) $handle, 'wgba-' ) ) {
				continue;
			}
			wp_dequeue_script( $handle );
		}
	}

	public static function maybe_enqueue(): void {
		if ( ! get_query_var( 'wgba_route' ) ) {
			return;
		}

		// Academy CSS must not depend on Google Fonts — fonts often fail/hang in BD and
		// would block the whole stylesheet (blank / “site not loading” look).
		wp_enqueue_style(
			'wgba-academy',
			WGBA_PLUGIN_URL . 'assets/css/academy.css',
			array(),
			WGBA_VERSION
		);

		// Optional fonts — non-blocking; page renders with system stack if this fails.
		wp_enqueue_style(
			'wgba-fonts',
			'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600&display=swap',
			array(),
			null
		);
		wp_style_add_data( 'wgba-fonts', 'media', 'print' );
		add_filter(
			'style_loader_tag',
			static function ( string $html, string $handle ): string {
				if ( 'wgba-fonts' !== $handle ) {
					return $html;
				}
				return str_replace(
					"media='print'",
					"media='print' onload=\"this.media='all'\"",
					$html
				);
			},
			10,
			2
		);

		wp_enqueue_script(
			'wgba-frontend',
			WGBA_PLUGIN_URL . 'assets/js/frontend/academy.js',
			array(),
			WGBA_VERSION,
			true
		);

		wp_localize_script(
			'wgba-frontend',
			'wgbaData',
			array(
				'restUrl'  => esc_url_raw( rest_url( REST_API::NS . '/' ) ),
				'nonce'    => wp_create_nonce( 'wp_rest' ),
				'loggedIn' => is_user_logged_in(),
				'messages' => array(
					'preview'  => Access::message_preview_hint(),
					'loginCh'  => Access::message_login_for_chapters(),
					'progress' => Access::message_login_for_progress(),
					'saving'   => 'সংরক্ষণ হচ্ছে…',
					'saved'    => 'সংরক্ষিত',
					'failed'   => 'সংরক্ষণ ব্যর্থ',
					'conflict' => 'দ্বন্দ্ব: অন্য ট্যাবে নতুন সংস্করণ আছে',
				),
				'loginUrl' => Rewrite::url( 'login' ),
			)
		);

		$route = get_query_var( 'wgba_route' );
		if ( in_array( $route, array( 'lesson', 'home' ), true ) ) {
			wp_enqueue_script(
				'wgba-playground-host',
				WGBA_PLUGIN_URL . 'assets/js/playground/runner-host.js',
				array( 'wgba-frontend' ),
				WGBA_VERSION,
				true
			);
			wp_localize_script(
				'wgba-playground-host',
				'wgbaPlayground',
				array(
					'workerUrl'        => WGBA_PLUGIN_URL . 'assets/js/playground/runner-worker.js',
					'quickjsUrl'       => WGBA_PLUGIN_URL . 'assets/js/playground/quickjs.js',
					'defaultTimeoutMs' => 3000,
					'maxTimeoutMs'     => 10000,
					'maxSourceChars'   => 50000,
					'maxOutputBytes'   => 65536,
					'maxOutputLines'   => 200,
				)
			);
		}
	}
}
