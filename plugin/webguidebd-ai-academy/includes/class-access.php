<?php
/**
 * Centralized course access decisions.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Access {

	public static function register_hooks(): void {
		// Prevent restricted lesson content leaking via REST for CPTs (CPTs not in REST).
		add_filter( 'the_content', array( self::class, 'filter_content_leak' ), 1 );
	}

	/**
	 * @return list<string>
	 */
	public static function public_preview_chapter_ids(): array {
		$ids = get_option( 'wgba_public_preview_chapters', array( 'ch-01-ai-llm-intro', 'ch-02-js-fundamentals' ) );
		if ( ! is_array( $ids ) ) {
			return array( 'ch-01-ai-llm-intro', 'ch-02-js-fundamentals' );
		}
		return array_values( array_map( 'strval', $ids ) );
	}

	public static function is_public_preview_chapter( string $chapter_stable_id ): bool {
		return in_array( $chapter_stable_id, self::public_preview_chapter_ids(), true );
	}

	public static function user_is_logged_in(): bool {
		return is_user_logged_in();
	}

	/**
	 * Whether the current (or given) user may read the full lesson body.
	 */
	public static function can_read_lesson_body( string $lesson_stable_id, ?int $user_id = null ): bool {
		$lesson = Content_Repository::get_lesson_by_stable_id( $lesson_stable_id );
		if ( ! $lesson ) {
			return false;
		}
		// Admins / curriculum staff: full body even for draft previews.
		if ( Capabilities::can_manage_curriculum( $user_id ) || self::user_is_admin( $user_id ) ) {
			return true;
		}
		if ( 'publish' !== $lesson['status'] ) {
			return false;
		}
		$chapter_id = (string) ( $lesson['chapter_stable_id'] ?? '' );
		if ( self::is_public_preview_chapter( $chapter_id ) ) {
			return true;
		}
		if ( null === $user_id ) {
			return is_user_logged_in();
		}
		return $user_id > 0 && get_userdata( $user_id ) instanceof \WP_User;
	}

	/**
	 * Site administrators always get curriculum preview (caps may be missing if
	 * the plugin was updated without re-activation).
	 */
	public static function user_is_admin( ?int $user_id = null ): bool {
		if ( null === $user_id ) {
			return current_user_can( 'manage_options' );
		}
		return user_can( $user_id, 'manage_options' );
	}

	/**
	 * Public overview is always available for published lessons.
	 */
	public static function can_read_lesson_overview( string $lesson_stable_id ): bool {
		$lesson = Content_Repository::get_lesson_by_stable_id( $lesson_stable_id );
		return (bool) ( $lesson && 'publish' === $lesson['status'] );
	}

	/**
	 * Guest-facing login messages (Bengali).
	 */
	public static function message_preview_hint(): string {
		return 'প্রথম দুই অধ্যায় বিনা লগইনে পড়ুন।';
	}

	public static function message_login_for_chapters(): string {
		return 'বাকি অধ্যায়গুলো বিনা মূল্যে পড়তে লগইন করুন।';
	}

	public static function message_login_for_progress(): string {
		return 'আপনার শেখার অগ্রগতি সংরক্ষণ করতে লগইন করুন।';
	}

	/**
	 * Strip accidental public rendering of protected post objects.
	 *
	 * @param mixed $content Content.
	 * @return string
	 */
	public static function filter_content_leak( $content ): string {
		$content = is_string( $content ) ? $content : '';
		if ( ! is_singular( array( 'wgba_lesson', 'wgba_chapter' ) ) ) {
			return $content;
		}
		// CPT singular views are not public routes; templates handle output.
		return '';
	}

	/**
	 * Validate internal redirect after auth.
	 *
	 * @param mixed $url URL.
	 */
	public static function sanitize_return_url( $url ): string {
		$url = is_string( $url ) ? $url : '';
		$url = wp_unslash( $url );
		$url = esc_url_raw( $url );
		if ( '' === $url ) {
			return \WGBA\Rewrite::url( 'home' );
		}
		// Reject scheme-relative and external.
		if ( preg_match( '#^//#', $url ) || preg_match( '#^[a-z][a-z0-9+.-]*:#i', $url ) ) {
			$home = wp_parse_url( home_url(), PHP_URL_HOST );
			$host = wp_parse_url( $url, PHP_URL_HOST );
			if ( $host && $home && strtolower( (string) $host ) !== strtolower( (string) $home ) ) {
				return \WGBA\Rewrite::url( 'home' );
			}
		}
		$path = (string) ( wp_parse_url( $url, PHP_URL_PATH ) ?? '' );
		$path = untrailingslashit( $path );
		$home_path = untrailingslashit( (string) ( wp_parse_url( home_url( '/' ), PHP_URL_PATH ) ?? '' ) );
		$is_site_root = ( '' === $path || $path === $home_path );
		$is_academy   = ( 0 === strpos( $path . '/', '/ai-academy/' ) ) || ( '/ai-academy' === $path );
		$is_admin     = ( false !== strpos( $path, '/wp-admin' ) );
		if ( ! $is_academy && ! $is_admin && ! ( $is_site_root && \WGBA\Rewrite::serve_as_front_page() ) ) {
			return \WGBA\Rewrite::url( 'home' );
		}
		return wp_validate_redirect( $url, \WGBA\Rewrite::url( 'home' ) );
	}
}
