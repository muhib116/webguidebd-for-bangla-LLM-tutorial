<?php
/**
 * Idempotent curriculum seed (public chapters).
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Content_Seeder {

	/**
	 * Admin-only seed — never runs on public front-end requests.
	 */
	public static function maybe_admin_seed(): void {
		if ( ! is_admin() || ! current_user_can( 'activate_plugins' ) ) {
			return;
		}
		$force = isset( $_GET['wgba_seed'] ) && isset( $_GET['_wpnonce'] )
			&& wp_verify_nonce( sanitize_text_field( wp_unslash( (string) $_GET['_wpnonce'] ) ), 'wgba_seed' );
		$needs = (int) get_option( 'wgba_needs_seed', 0 ) === 1
			|| (string) get_option( 'wgba_seed_version', '' ) !== WGBA_VERSION;
		$empty = ! Content_Repository::get_chapter_by_stable_id( 'ch-01-ai-llm-intro' );
		if ( ! $force && ! $needs && ! $empty ) {
			return;
		}
		if ( function_exists( 'set_time_limit' ) ) {
			set_time_limit( 180 );
		}
		self::seed_public_curriculum( $force );
		delete_option( 'wgba_needs_seed' );
		update_option( 'wgba_seed_version', WGBA_VERSION, false );
		if ( $force ) {
			wp_safe_redirect( admin_url( 'admin.php?page=wgba-academy&wgba_seeded=1' ) );
			exit;
		}
	}

	/**
	 * @param bool $force Overwrite existing published seeded lessons (payload/body refresh).
	 */
	public static function seed_public_curriculum( bool $force = false ): void {
		require_once WGBA_PLUGIN_DIR . 'content/public/chapters.php';
		require_once WGBA_PLUGIN_DIR . 'content/public/glossary-seed.php';

		$chapters = \wgba_seed_chapters();
		$keep_ids = array();
		foreach ( $chapters as $chapter ) {
			self::upsert_chapter( $chapter );
			$keep_ids[] = (string) $chapter['stable_id'];
		}
		self::trash_stale_chapter_drafts( $keep_ids );

		foreach ( self::load_lesson_seeds() as $lesson ) {
			if ( $force ) {
				$lesson['force'] = true;
			}
			self::upsert_lesson( $lesson );
		}

		foreach ( \wgba_seed_glossary() as $term ) {
			self::upsert_glossary( $term );
		}
	}

	/**
	 * After upsert publishes the current seed chapters, trash leftover draft
	 * shells (early “Milestone D” placeholders / duplicates) so the roadmap
	 * never lists unpublished ghosts.
	 *
	 * @param list<string> $keep_stable_ids Current chapter stable IDs (unused; documents intent).
	 */
	private static function trash_stale_chapter_drafts( array $keep_stable_ids ): void {
		unset( $keep_stable_ids );
		$posts = get_posts(
			array(
				'post_type'      => 'wgba_chapter',
				'post_status'    => array( 'draft', 'pending', 'private' ),
				'posts_per_page' => 100,
			)
		);
		foreach ( $posts as $post ) {
			wp_trash_post( (int) $post->ID );
		}
	}

	/**
	 * Lesson seeds for chapters 1–14. Public chapters live in content/public/,
	 * login-required chapters in content/restricted/ (HTTP access denied).
	 *
	 * @return list<array<string,mixed>>
	 */
	private static function load_lesson_seeds(): array {
		$all = array();
		for ( $n = 1; $n <= 14; $n++ ) {
			$nn = str_pad( (string) $n, 2, '0', STR_PAD_LEFT );
			$fn = 'wgba_seed_lessons_ch' . $nn;
			foreach ( array( 'public', 'restricted' ) as $dir ) {
				$file = WGBA_PLUGIN_DIR . 'content/' . $dir . '/lessons-ch' . $nn . '.php';
				if ( is_readable( $file ) ) {
					require_once $file;
					break;
				}
			}
			if ( function_exists( $fn ) ) {
				$all = array_merge( $all, (array) $fn() );
			}
		}
		return $all;
	}

	/**
	 * @param array<string,mixed> $data Chapter.
	 */
	private static function upsert_chapter( array $data ): void {
		$existing = Content_Repository::get_chapter_by_stable_id( (string) $data['stable_id'] );
		$postarr  = array(
			'post_type'    => 'wgba_chapter',
			'post_title'   => (string) $data['title'],
			'post_name'    => (string) $data['slug'],
			'post_content' => (string) ( $data['body'] ?? '' ),
			'post_status'  => (string) ( $data['status'] ?? 'publish' ),
			'menu_order'   => (int) ( $data['order'] ?? 0 ),
		);
		if ( $existing ) {
			$postarr['ID'] = (int) $existing['id'];
			$post_id         = wp_update_post( $postarr, true );
		} else {
			$post_id = wp_insert_post( $postarr, true );
		}
		if ( is_wp_error( $post_id ) ) {
			return;
		}
		update_post_meta( $post_id, '_wgba_stable_id', (string) $data['stable_id'] );
		update_post_meta( $post_id, '_wgba_summary', (string) ( $data['summary'] ?? '' ) );
		update_post_meta( $post_id, '_wgba_content_version', (string) ( $data['content_version'] ?? '1' ) );
	}

	/**
	 * @param array<string,mixed> $data Lesson.
	 */
	private static function upsert_lesson( array $data ): void {
		$existing = Content_Repository::get_lesson_by_stable_id( (string) $data['stable_id'] );
		// Do not overwrite independently edited published lessons on re-activation unless seed flag.
		if ( $existing && 'publish' === $existing['status'] && empty( $data['force'] ) ) {
			$seeded = get_post_meta( (int) $existing['id'], '_wgba_seed_fingerprint', true );
			if ( $seeded === self::lesson_fingerprint( $data ) ) {
				return;
			}
		}
		$postarr = array(
			'post_type'    => 'wgba_lesson',
			'post_title'   => (string) $data['title'],
			'post_name'    => (string) $data['slug'],
			'post_content' => (string) ( $data['body_html'] ?? '' ),
			'post_status'  => (string) ( $data['status'] ?? 'publish' ),
			'menu_order'   => (int) ( $data['order'] ?? 0 ),
		);
		if ( $existing ) {
			$postarr['ID'] = (int) $existing['id'];
			$post_id         = wp_update_post( $postarr, true );
		} else {
			$post_id = wp_insert_post( $postarr, true );
		}
		if ( is_wp_error( $post_id ) ) {
			return;
		}
		update_post_meta( $post_id, '_wgba_stable_id', (string) $data['stable_id'] );
		update_post_meta( $post_id, '_wgba_chapter_stable_id', (string) $data['chapter_stable_id'] );
		update_post_meta( $post_id, '_wgba_summary', (string) ( $data['summary'] ?? '' ) );
		update_post_meta( $post_id, '_wgba_public_overview', (string) ( $data['public_overview'] ?? $data['summary'] ?? '' ) );
		update_post_meta( $post_id, '_wgba_estimated_minutes', (int) ( $data['estimated_minutes'] ?? 20 ) );
		update_post_meta( $post_id, '_wgba_required', ! empty( $data['required'] ) ? 1 : 0 );
		update_post_meta( $post_id, '_wgba_prerequisites', array_values( (array) ( $data['prerequisites'] ?? array() ) ) );
		update_post_meta( $post_id, '_wgba_objectives', array_values( (array) ( $data['objectives'] ?? array() ) ) );
		update_post_meta( $post_id, '_wgba_content_version', (string) ( $data['content_version'] ?? '1' ) );
		$payload = $data['payload'] ?? array();
		if ( ! is_array( $payload ) ) {
			$payload = array();
		}
		$encoded = wp_json_encode( $payload, JSON_UNESCAPED_UNICODE );
		if ( false === $encoded ) {
			$encoded = '{}';
		}
		// update_post_meta expects slashed data; without wp_slash, JSON escapes corrupt.
		update_post_meta( $post_id, '_wgba_payload_json', wp_slash( $encoded ) );
		update_post_meta( $post_id, '_wgba_seed_fingerprint', self::lesson_fingerprint( $data ) );
		update_post_meta( $post_id, '_wgba_verification', wp_json_encode( $data['verification'] ?? array(), JSON_UNESCAPED_UNICODE ) );
	}

	/**
	 * content_hash comes from the build, so any source edit re-seeds that lesson on upgrade.
	 *
	 * @param array<string,mixed> $data Lesson.
	 */
	private static function lesson_fingerprint( array $data ): string {
		return md5( (string) $data['stable_id'] . '|' . (string) ( $data['content_version'] ?? '1' ) . '|' . (string) ( $data['content_hash'] ?? '' ) );
	}

	/**
	 * @param array<string,mixed> $data Glossary term.
	 */
	private static function upsert_glossary( array $data ): void {
		$posts = get_posts(
			array(
				'post_type'      => 'wgba_glossary',
				'meta_key'       => '_wgba_stable_id',
				'meta_value'     => (string) $data['stable_id'],
				'posts_per_page' => 1,
				'post_status'    => 'any',
			)
		);
		$postarr = array(
			'post_type'    => 'wgba_glossary',
			'post_title'   => (string) $data['title'],
			'post_name'    => (string) $data['slug'],
			'post_content' => (string) ( $data['body'] ?? '' ),
			'post_status'  => 'publish',
		);
		if ( $posts ) {
			$postarr['ID'] = $posts[0]->ID;
			$post_id         = wp_update_post( $postarr, true );
		} else {
			$post_id = wp_insert_post( $postarr, true );
		}
		if ( ! is_wp_error( $post_id ) ) {
			update_post_meta( $post_id, '_wgba_stable_id', (string) $data['stable_id'] );
			update_post_meta( $post_id, '_wgba_synonyms', (array) ( $data['synonyms'] ?? array() ) );
			update_post_meta( $post_id, '_wgba_lesson_slug', (string) ( $data['lesson_slug'] ?? '' ) );
			update_post_meta( $post_id, '_wgba_lesson_title', (string) ( $data['lesson_title'] ?? '' ) );
			update_post_meta( $post_id, '_wgba_lesson_public', ! empty( $data['lesson_public'] ) ? 1 : 0 );
		}
	}
}
