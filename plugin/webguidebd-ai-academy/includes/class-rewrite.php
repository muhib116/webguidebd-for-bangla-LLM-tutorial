<?php
/**
 * Pretty routes under /ai-academy/ (and optional site front page).
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Rewrite {

	public static function register(): void {
		add_action( 'init', array( self::class, 'add_rules' ) );
		add_filter( 'query_vars', array( self::class, 'query_vars' ) );
		add_action( 'template_redirect', array( self::class, 'maybe_serve_front_page' ), 0 );
		add_action( 'template_redirect', array( self::class, 'maybe_brand_pages' ), 1 );
	}

	/**
	 * When enabled, https://example.com/ shows the Academy home
	 * (same template as /ai-academy/). /ai-academy/ then 301s to /.
	 */
	public static function serve_as_front_page(): bool {
		$settings = get_option( 'wgba_settings', array() );
		if ( ! is_array( $settings ) ) {
			return true;
		}
		if ( array_key_exists( 'serve_as_front_page', $settings ) ) {
			return ! empty( $settings['serve_as_front_page'] );
		}
		// Default on: this site's primary surface is the Academy.
		return true;
	}

	public static function maybe_serve_front_page(): void {
		if ( ! self::serve_as_front_page() ) {
			return;
		}
		if ( is_admin() || wp_doing_ajax() || wp_doing_cron() || is_feed() || is_preview() ) {
			return;
		}
		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			return;
		}

		$route = (string) get_query_var( 'wgba_route' );

		// Pretty /ai-academy/ → canonical site root (avoid two homes).
		if ( 'home' === $route ) {
			$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
			$path        = (string) wp_parse_url( $request_uri, PHP_URL_PATH );
			if ( preg_match( '#/ai-academy/?$#', $path ) ) {
				wp_safe_redirect( home_url( '/' ), 301 );
				exit;
			}
		}

		if ( $route ) {
			return;
		}

		self::maybe_brand_pages();

		// WordPress front page (static Elementor page or blog index) → Academy home.
		if ( is_front_page() || ( is_home() && 'posts' === get_option( 'show_on_front' ) ) ) {
			set_query_var( 'wgba_route', 'home' );
			global $wp_query;
			if ( $wp_query instanceof \WP_Query ) {
				$wp_query->set( 'wgba_route', 'home' );
			}
		}
	}

	public static function add_rules(): void {
		$base = 'ai-academy';

		add_rewrite_rule( "^{$base}/?$", 'index.php?wgba_route=home', 'top' );
		add_rewrite_rule( "^{$base}/roadmap/?$", 'index.php?wgba_route=roadmap', 'top' );
		add_rewrite_rule( "^{$base}/chapter/([^/]+)/?$", 'index.php?wgba_route=chapter&wgba_slug=$matches[1]', 'top' );
		add_rewrite_rule( "^{$base}/lesson/([^/]+)/?$", 'index.php?wgba_route=lesson&wgba_slug=$matches[1]', 'top' );
		add_rewrite_rule( "^{$base}/glossary/?$", 'index.php?wgba_route=glossary', 'top' );
		add_rewrite_rule( "^{$base}/glossary/([^/]+)/?$", 'index.php?wgba_route=glossary_term&wgba_slug=$matches[1]', 'top' );
		add_rewrite_rule( "^{$base}/projects/?$", 'index.php?wgba_route=projects', 'top' );
		add_rewrite_rule( "^{$base}/author/?$", 'index.php?wgba_route=author', 'top' );
		add_rewrite_rule( "^{$base}/about/?$", 'index.php?wgba_route=author', 'top' );
		add_rewrite_rule( "^{$base}/contact/?$", 'index.php?wgba_route=contact', 'top' );
		add_rewrite_rule( "^{$base}/dashboard/?$", 'index.php?wgba_route=dashboard', 'top' );
		add_rewrite_rule( "^{$base}/login/?$", 'index.php?wgba_route=login', 'top' );
		add_rewrite_rule( "^{$base}/register/?$", 'index.php?wgba_route=register', 'top' );
		add_rewrite_rule( "^{$base}/lost-password/?$", 'index.php?wgba_route=lost_password', 'top' );
		add_rewrite_rule( "^{$base}/reset-password/?$", 'index.php?wgba_route=reset_password', 'top' );
		add_rewrite_rule( "^{$base}/profile/?$", 'index.php?wgba_route=profile', 'top' );
		add_rewrite_rule( "^{$base}/notes/?$", 'index.php?wgba_route=notes', 'top' );
		add_rewrite_rule( "^{$base}/bookmarks/?$", 'index.php?wgba_route=bookmarks', 'top' );
		add_rewrite_rule( "^{$base}/questions/?$", 'index.php?wgba_route=questions', 'top' );
		add_rewrite_rule( "^{$base}/privacy/?$", 'index.php?wgba_route=privacy', 'top' );
		add_rewrite_rule( "^{$base}/terms/?$", 'index.php?wgba_route=terms', 'top' );
		add_rewrite_rule( "^{$base}/editorial/?$", 'index.php?wgba_route=editorial', 'top' );
		add_rewrite_rule( "^{$base}/sitemap\.xml$", 'index.php?wgba_route=sitemap', 'top' );
		add_rewrite_rule( "^{$base}/llms\.txt$", 'index.php?wgba_route=llms', 'top' );
		// Site-root discovery (search engines + LLM agents).
		add_rewrite_rule( '^sitemap\.xml$', 'index.php?wgba_route=sitemap', 'top' );
		add_rewrite_rule( '^llms\.txt$', 'index.php?wgba_route=llms', 'top' );
	}

	/**
	 * @param mixed $vars Vars.
	 * @return list<string>
	 */
	/**
	 * Replace Elementor About / Contact pages with Academy brand templates.
	 */
	public static function maybe_brand_pages(): void {
		if ( is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
			return;
		}
		if ( get_query_var( 'wgba_route' ) ) {
			return;
		}
		$route = '';
		if ( is_page( array( 'about', 'about-us', 'author' ) ) ) {
			$route = 'author';
		} elseif ( is_page( array( 'contact-us', 'contact' ) ) ) {
			$route = 'contact';
		}
		if ( ! $route ) {
			return;
		}
		set_query_var( 'wgba_route', $route );
		global $wp_query;
		if ( $wp_query instanceof \WP_Query ) {
			$wp_query->set( 'wgba_route', $route );
			$wp_query->is_page     = false;
			$wp_query->is_singular = false;
			$wp_query->is_404      = false;
		}
		status_header( 200 );
	}

	public static function query_vars( $vars ): array {
		if ( ! is_array( $vars ) ) {
			$vars = array();
		}
		$vars[] = 'wgba_route';
		$vars[] = 'wgba_slug';
		return $vars;
	}

	public static function url( string $route, string $slug = '' ): string {
		if ( 'home' === $route && self::serve_as_front_page() ) {
			return home_url( '/' );
		}
		// Brand pages: WP slugs that maybe_brand_pages() hijacks into Academy chrome.
		if ( 'author' === $route ) {
			return home_url( '/about/' );
		}
		if ( 'contact' === $route ) {
			return home_url( '/contact-us/' );
		}
		$map = array(
			'home'           => 'ai-academy/',
			'roadmap'        => 'ai-academy/roadmap/',
			'chapter'        => 'ai-academy/chapter/' . rawurlencode( $slug ) . '/',
			'lesson'         => 'ai-academy/lesson/' . rawurlencode( $slug ) . '/',
			'glossary'       => 'ai-academy/glossary/',
			'glossary_term'  => 'ai-academy/glossary/' . rawurlencode( $slug ) . '/',
			'projects'       => 'ai-academy/projects/',
			'dashboard'      => 'ai-academy/dashboard/',
			'login'          => 'ai-academy/login/',
			'register'       => 'ai-academy/register/',
			'lost_password'  => 'ai-academy/lost-password/',
			'reset_password' => 'ai-academy/reset-password/',
			'profile'        => 'ai-academy/profile/',
			'notes'          => 'ai-academy/notes/',
			'bookmarks'      => 'ai-academy/bookmarks/',
			'questions'      => 'ai-academy/questions/',
			'privacy'        => 'ai-academy/privacy/',
			'terms'          => 'ai-academy/terms/',
			'editorial'      => 'ai-academy/editorial/',
		);
		$path = $map[ $route ] ?? 'ai-academy/';
		return home_url( '/' . $path );
	}
}
