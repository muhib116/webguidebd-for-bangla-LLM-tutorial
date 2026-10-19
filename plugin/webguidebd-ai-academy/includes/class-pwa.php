<?php
/**
 * Progressive Web App — manifest, icons, service worker, install meta.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class PWA {

	public static function register(): void {
		add_action( 'template_redirect', array( self::class, 'maybe_serve_endpoints' ), 0 );
		add_action( 'wp_head', array( self::class, 'head_tags' ), 2 );
		add_filter( 'wgba_localize_frontend', array( self::class, 'localize' ) );
	}

	/**
	 * Academy surfaces that should expose PWA chrome.
	 */
	public static function is_academy_surface(): bool {
		$route = (string) get_query_var( 'wgba_route' );
		if ( '' !== $route ) {
			return true;
		}
		return ( is_front_page() || is_home() ) && Rewrite::serve_as_front_page();
	}

	/**
	 * @param array<string,mixed> $data Localized script data.
	 * @return array<string,mixed>
	 */
	public static function localize( array $data ): array {
		if ( ! self::is_academy_surface() ) {
			return $data;
		}
		$data['pwa'] = array(
			'enabled'    => true,
			'swUrl'      => self::sw_url(),
			'manifest'   => self::manifest_url(),
			'scope'      => trailingslashit( home_url( '/' ) ),
			'version'    => WGBA_VERSION,
			'offlineUrl' => self::offline_url(),
		);
		return $data;
	}

	public static function manifest_url(): string {
		return home_url( '/manifest.webmanifest' );
	}

	public static function sw_url(): string {
		return home_url( '/sw.js' );
	}

	public static function offline_url(): string {
		return home_url( '/ai-academy/offline/' );
	}

	public static function icon_url( string $file ): string {
		return add_query_arg( 'ver', WGBA_VERSION, WGBA_PLUGIN_URL . 'assets/img/pwa/' . ltrim( $file, '/' ) );
	}

	public static function maybe_serve_endpoints(): void {
		if ( is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
			return;
		}
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
		$path        = (string) wp_parse_url( $request_uri, PHP_URL_PATH );
		$path        = untrailingslashit( $path );

		$route = (string) get_query_var( 'wgba_route' );

		if ( 'manifest' === $route || preg_match( '#/(?:ai-academy/)?manifest\.webmanifest$#', $path ) ) {
			self::serve_manifest();
		}
		if ( 'sw' === $route || preg_match( '#/(?:ai-academy/)?sw\.js$#', $path ) ) {
			self::serve_service_worker();
		}
		if ( 'offline' === $route || preg_match( '#/ai-academy/offline/?$#', $path ) ) {
			self::serve_offline_page();
		}
	}

	public static function head_tags(): void {
		if ( ! self::is_academy_surface() ) {
			return;
		}

		$manifest = esc_url( self::manifest_url() );
		$icon180  = esc_url( self::icon_url( 'apple-touch-icon.png' ) );
		$icon192  = esc_url( self::icon_url( 'icon-192.png' ) );

		echo '<link rel="manifest" href="' . $manifest . '">' . "\n";
		echo '<meta name="theme-color" content="#04AA6D" media="(prefers-color-scheme: light)">' . "\n";
		echo '<meta name="theme-color" content="#0d1520" media="(prefers-color-scheme: dark)">' . "\n";
		echo '<meta name="mobile-web-app-capable" content="yes">' . "\n";
		echo '<meta name="apple-mobile-web-app-capable" content="yes">' . "\n";
		echo '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">' . "\n";
		echo '<meta name="apple-mobile-web-app-title" content="AI Academy">' . "\n";
		echo '<link rel="apple-touch-icon" href="' . $icon180 . '">' . "\n";
		echo '<link rel="icon" type="image/png" sizes="192x192" href="' . $icon192 . '">' . "\n";
		echo '<link rel="icon" type="image/png" sizes="48x48" href="' . esc_url( self::icon_url( 'icon-48.png' ) ) . '">' . "\n";
	}

	public static function serve_manifest(): void {
		nocache_headers();
		header( 'Content-Type: application/manifest+json; charset=UTF-8' );
		header( 'X-Robots-Tag: noindex' );
		status_header( 200 );

		$start = home_url( '/' );
		$icons = array(
			array(
				'src'     => self::icon_url( 'icon-192.png' ),
				'sizes'   => '192x192',
				'type'    => 'image/png',
				'purpose' => 'any',
			),
			array(
				'src'     => self::icon_url( 'icon-512.png' ),
				'sizes'   => '512x512',
				'type'    => 'image/png',
				'purpose' => 'any',
			),
			array(
				'src'     => self::icon_url( 'icon-192-maskable.png' ),
				'sizes'   => '192x192',
				'type'    => 'image/png',
				'purpose' => 'maskable',
			),
			array(
				'src'     => self::icon_url( 'icon-512-maskable.png' ),
				'sizes'   => '512x512',
				'type'    => 'image/png',
				'purpose' => 'maskable',
			),
		);

		$manifest = array(
			'id'               => $start,
			'name'             => 'WebGuideBD AI Academy',
			'short_name'       => 'AI Academy',
			'description'      => 'বাংলায় practical AI ও LLM — বিনামূল্যে শিখুন।',
			'lang'             => 'bn',
			'dir'              => 'ltr',
			'start_url'        => $start,
			'scope'            => trailingslashit( home_url( '/' ) ),
			'display'          => 'standalone',
			'display_override' => array( 'standalone', 'minimal-ui', 'browser' ),
			'orientation'      => 'any',
			'background_color' => '#0d1520',
			'theme_color'      => '#04AA6D',
			'categories'       => array( 'education', 'productivity' ),
			'icons'            => $icons,
			'shortcuts'        => array(
				array(
					'name'        => 'রোডম্যাপ',
					'short_name'  => 'রোডম্যাপ',
					'description' => 'পূর্ণ পাঠ্যক্রম দেখুন',
					'url'         => Rewrite::url( 'roadmap' ),
					'icons'       => array(
						array(
							'src'   => self::icon_url( 'icon-192.png' ),
							'sizes' => '192x192',
							'type'  => 'image/png',
						),
					),
				),
				array(
					'name'        => 'প্রথম পাঠ',
					'short_name'  => 'পাঠ',
					'description' => 'AI কী — প্রথম পাঠ শুরু',
					'url'         => Rewrite::url( 'lesson', 'ai-ki' ),
					'icons'       => array(
						array(
							'src'   => self::icon_url( 'icon-192.png' ),
							'sizes' => '192x192',
							'type'  => 'image/png',
						),
					),
				),
				array(
					'name'        => 'লগইন',
					'short_name'  => 'লগইন',
					'description' => 'অ্যাকাউন্টে প্রবেশ',
					'url'         => Rewrite::url( 'login' ),
					'icons'       => array(
						array(
							'src'   => self::icon_url( 'icon-192.png' ),
							'sizes' => '192x192',
							'type'  => 'image/png',
						),
					),
				),
			),
		);

		echo wp_json_encode( $manifest, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
		exit;
	}

	public static function serve_service_worker(): void {
		$file = WGBA_PLUGIN_DIR . 'assets/js/pwa/sw.js';
		if ( ! is_readable( $file ) ) {
			status_header( 404 );
			exit;
		}

		// Allow controlling the whole origin even though the file is rewritten.
		header( 'Content-Type: application/javascript; charset=UTF-8' );
		header( 'Service-Worker-Allowed: /' );
		header( 'Cache-Control: no-cache, no-store, must-revalidate' );
		header( 'X-Robots-Tag: noindex' );
		status_header( 200 );

		$shell = array(
			trailingslashit( home_url( '/' ) ),
			self::offline_url(),
			WGBA_PLUGIN_URL . 'assets/css/academy.css?ver=' . rawurlencode( WGBA_VERSION ),
			WGBA_PLUGIN_URL . 'assets/js/frontend/academy.js?ver=' . rawurlencode( WGBA_VERSION ),
			self::icon_url( 'icon-192.png' ),
			self::icon_url( 'icon-512.png' ),
			Site_Profile::logo_url( 'dark' ),
			Site_Profile::logo_url( 'light' ),
		);

		$js = (string) file_get_contents( $file );
		$js = str_replace(
			array(
				'__WGBA_CACHE_VERSION__',
				'__WGBA_OFFLINE_URL__',
				'__WGBA_PRECACHE__',
			),
			array(
				WGBA_VERSION,
				self::offline_url(),
				wp_json_encode( array_values( array_unique( $shell ) ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			),
			$js
		);
		echo $js; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JS asset.
		exit;
	}

	public static function serve_offline_page(): void {
		nocache_headers();
		header( 'Content-Type: text/html; charset=UTF-8' );
		header( 'X-Robots-Tag: noindex' );
		status_header( 200 );

		$home = esc_url( home_url( '/' ) );
		$css  = esc_url( WGBA_PLUGIN_URL . 'assets/css/academy.css?ver=' . rawurlencode( WGBA_VERSION ) );
		$icon = esc_url( self::icon_url( 'icon-192.png' ) );
		?>
<!DOCTYPE html>
<html lang="bn">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="theme-color" content="#04AA6D">
	<title>অফলাইন — WebGuideBD AI Academy</title>
	<link rel="stylesheet" href="<?php echo $css; ?>">
	<link rel="icon" href="<?php echo $icon; ?>">
	<style>
		.wgba-offline {
			min-height: 100vh;
			display: grid;
			place-items: center;
			padding: 32px 20px;
			text-align: center;
			background: #0d1520;
			color: #f1f1f1;
		}
		.wgba-offline h1 { margin: 16px 0 8px; font-size: 28px; }
		.wgba-offline p { margin: 0 0 20px; color: #bbb; max-width: 28rem; }
		.wgba-offline img { width: 72px; height: 72px; border-radius: 16px; }
	</style>
</head>
<body class="wgba-body" data-wgba-theme="dark">
	<main class="wgba-offline">
		<div>
			<img src="<?php echo $icon; ?>" width="72" height="72" alt="">
			<h1>আপনি অফলাইন</h1>
			<p>ইন্টারনেট সংযোগ নেই। আগে খোলা পেজগুলো ক্যাশে থাকতে পারে — সংযোগ ফিরলে আবার চেষ্টা করুন।</p>
			<p class="wgba-actions">
				<a class="wgba-btn" href="<?php echo $home; ?>">হোমে যান</a>
				<button type="button" class="wgba-btn wgba-btn-ghost" onclick="location.reload()">আবার চেষ্টা</button>
			</p>
		</div>
	</main>
</body>
</html>
		<?php
		exit;
	}
}
