<?php
/**
 * Front-end template routing.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Templates {

	public static function register(): void {
		add_filter( 'template_include', array( self::class, 'include_template' ), 99 );
		add_action( 'wp_enqueue_scripts', array( Assets::class, 'maybe_enqueue' ) );
	}

	/**
	 * @param mixed $template Template path.
	 * @return string
	 */
	public static function include_template( $template ): string {
		$template = is_string( $template ) ? $template : '';
		$route    = get_query_var( 'wgba_route' );
		if ( ! $route ) {
			return $template;
		}
		$file = WGBA_PLUGIN_DIR . 'templates/route-' . str_replace( '_', '-', sanitize_key( (string) $route ) ) . '.php';
		if ( is_readable( $file ) ) {
			status_header( 200 );
			return $file;
		}
		$file = WGBA_PLUGIN_DIR . 'templates/route-home.php';
		return is_readable( $file ) ? $file : $template;
	}

	/**
	 * Render a partial.
	 *
	 * @param string               $name Partial name.
	 * @param array<string,mixed>  $vars Vars.
	 */
	public static function partial( string $name, array $vars = array() ): void {
		$path = WGBA_PLUGIN_DIR . 'templates/partials/' . $name . '.php';
		if ( ! is_readable( $path ) ) {
			return;
		}
		// phpcs:ignore WordPress.PHP.DontExtract.extract_extract
		extract( $vars, EXTR_SKIP );
		include $path;
	}

	/**
	 * Layout wrapper start.
	 *
	 * @param array<string,mixed> $ctx Context.
	 */
	public static function header( array $ctx = array() ): void {
		self::partial( 'header', $ctx );
	}

	/**
	 * Mint page hero — same band as the homepage hero.
	 *
	 * @param array<string,mixed> $ctx title, lead, eyebrow, crumbs[], actions_html.
	 */
	public static function page_hero( array $ctx = array() ): void {
		self::partial( 'page-hero', $ctx );
	}

	/**
	 * Layout wrapper end.
	 *
	 * @param array<string,mixed> $ctx Context.
	 */
	public static function footer( array $ctx = array() ): void {
		self::partial( 'footer', $ctx );
	}
}
