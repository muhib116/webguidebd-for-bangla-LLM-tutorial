<?php
/**
 * PSR-4-ish autoloader for WGBA\ classes.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Autoloader {

	/**
	 * Register spl autoload.
	 */
	public static function register(): void {
		spl_autoload_register( array( self::class, 'load' ) );
	}

	/**
	 * @param string $class Fully-qualified class name.
	 */
	public static function load( string $class ): void {
		if ( strpos( $class, 'WGBA\\' ) !== 0 ) {
			return;
		}
		$relative = substr( $class, 5 );
		$relative = strtolower( str_replace( '_', '-', $relative ) );
		$relative = str_replace( '\\', '/', $relative );
		$path     = WGBA_PLUGIN_DIR . 'includes/class-' . str_replace( '/', '/class-', $relative ) . '.php';

		// Map WGBA\Foo_Bar -> includes/class-foo-bar.php
		$parts = explode( '\\', substr( $class, 5 ) );
		$file  = 'class-' . strtolower( str_replace( '_', '-', (string) array_pop( $parts ) ) ) . '.php';
		$dir   = WGBA_PLUGIN_DIR . 'includes/';
		if ( $parts ) {
			$subdir = strtolower( str_replace( '_', '-', implode( '/', $parts ) ) );
			$dir   .= $subdir . '/';
		}
		$path = $dir . $file;

		if ( is_readable( $path ) ) {
			require_once $path;
		}
	}
}
