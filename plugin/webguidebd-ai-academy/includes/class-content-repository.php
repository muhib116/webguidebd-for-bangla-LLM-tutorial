<?php
/**
 * Content lookup by stable IDs.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Content_Repository {

	/**
	 * @return array<string,mixed>|null
	 */
	public static function get_chapter_by_stable_id( string $stable_id ): ?array {
		return self::get_by_meta( 'wgba_chapter', $stable_id );
	}

	/**
	 * @return array<string,mixed>|null
	 */
	public static function get_chapter_by_slug( string $slug ): ?array {
		$posts = get_posts(
			array(
				'post_type'      => 'wgba_chapter',
				'name'           => $slug,
				'post_status'    => array( 'publish', 'draft' ),
				'posts_per_page' => 1,
			)
		);
		if ( ! $posts ) {
			return null;
		}
		return self::hydrate_chapter( $posts[0] );
	}

	/**
	 * @return array<string,mixed>|null
	 */
	public static function get_lesson_by_stable_id( string $stable_id ): ?array {
		return self::get_by_meta( 'wgba_lesson', $stable_id );
	}

	/**
	 * @return array<string,mixed>|null
	 */
	public static function get_lesson_by_slug( string $slug ): ?array {
		$posts = get_posts(
			array(
				'post_type'      => 'wgba_lesson',
				'name'           => $slug,
				'post_status'    => array( 'publish', 'draft' ),
				'posts_per_page' => 1,
			)
		);
		if ( ! $posts ) {
			return null;
		}
		return self::hydrate_lesson( $posts[0] );
	}

	/**
	 * @return list<array<string,mixed>>
	 */
	public static function list_chapters( bool $published_only = true ): array {
		$args = array(
			'post_type'      => 'wgba_chapter',
			'post_status'    => $published_only ? array( 'publish' ) : array( 'publish', 'draft' ),
			'posts_per_page' => 100,
			'orderby'        => 'menu_order',
			'order'          => 'ASC',
		);
		$out = array();
		foreach ( get_posts( $args ) as $post ) {
			$out[] = self::hydrate_chapter( $post );
		}
		return $out;
	}

	/**
	 * @return list<array<string,mixed>>
	 */
	public static function list_lessons_for_chapter( string $chapter_stable_id, bool $published_only = true ): array {
		$args = array(
			'post_type'      => 'wgba_lesson',
			'post_status'    => $published_only ? array( 'publish' ) : array( 'publish', 'draft' ),
			'posts_per_page' => 200,
			'orderby'        => 'menu_order',
			'order'          => 'ASC',
			'meta_key'       => '_wgba_chapter_stable_id',
			'meta_value'     => $chapter_stable_id,
		);
		$out = array();
		foreach ( get_posts( $args ) as $post ) {
			$out[] = self::hydrate_lesson( $post );
		}
		return $out;
	}

	/**
	 * @return array<string,mixed>|null
	 */
	private static function get_by_meta( string $post_type, string $stable_id ): ?array {
		$posts = get_posts(
			array(
				'post_type'      => $post_type,
				'post_status'    => array( 'publish', 'draft', 'private' ),
				'posts_per_page' => 1,
				'meta_key'       => '_wgba_stable_id',
				'meta_value'     => $stable_id,
			)
		);
		if ( ! $posts ) {
			return null;
		}
		return 'wgba_chapter' === $post_type
			? self::hydrate_chapter( $posts[0] )
			: self::hydrate_lesson( $posts[0] );
	}

	/**
	 * @return array<string,mixed>
	 */
	private static function hydrate_chapter( \WP_Post $post ): array {
		return array(
			'id'              => $post->ID,
			'stable_id'       => (string) get_post_meta( $post->ID, '_wgba_stable_id', true ),
			'slug'            => $post->post_name,
			'title'           => $post->post_title,
			'summary'         => (string) get_post_meta( $post->ID, '_wgba_summary', true ),
			'status'          => $post->post_status,
			'menu_order'      => (int) $post->menu_order,
			'content_version' => (string) get_post_meta( $post->ID, '_wgba_content_version', true ) ?: '1',
			'body'            => $post->post_content,
		);
	}

	/**
	 * @return array<string,mixed>
	 */
	private static function hydrate_lesson( \WP_Post $post ): array {
		$payload = get_post_meta( $post->ID, '_wgba_payload_json', true );
		$data    = is_string( $payload ) ? json_decode( $payload, true ) : array();
		if ( ! is_array( $data ) ) {
			$data = array();
		}
		return array(
			'id'                 => $post->ID,
			'stable_id'          => (string) get_post_meta( $post->ID, '_wgba_stable_id', true ),
			'chapter_stable_id'  => (string) get_post_meta( $post->ID, '_wgba_chapter_stable_id', true ),
			'slug'               => $post->post_name,
			'title'              => $post->post_title,
			'summary'            => (string) get_post_meta( $post->ID, '_wgba_summary', true ),
			'public_overview'    => (string) get_post_meta( $post->ID, '_wgba_public_overview', true ),
			'status'             => $post->post_status,
			'menu_order'         => (int) $post->menu_order,
			'content_version'    => (string) get_post_meta( $post->ID, '_wgba_content_version', true ) ?: '1',
			'estimated_minutes'  => (int) get_post_meta( $post->ID, '_wgba_estimated_minutes', true ),
			'required'           => (bool) get_post_meta( $post->ID, '_wgba_required', true ),
			'prerequisites'      => array_values( (array) get_post_meta( $post->ID, '_wgba_prerequisites', true ) ),
			'objectives'         => array_values( (array) get_post_meta( $post->ID, '_wgba_objectives', true ) ),
			'body'               => $post->post_content,
			'payload'            => $data,
			'modified_gmt'       => $post->post_modified_gmt,
		);
	}

	/**
	 * Public fields only for APIs / SEO.
	 *
	 * @param array<string,mixed> $lesson Lesson.
	 * @return array<string,mixed>
	 */
	public static function public_lesson_fields( array $lesson ): array {
		return array(
			'stable_id'         => $lesson['stable_id'],
			'slug'              => $lesson['slug'],
			'title'             => $lesson['title'],
			'summary'           => $lesson['summary'],
			'public_overview'   => $lesson['public_overview'],
			'chapter_stable_id' => $lesson['chapter_stable_id'],
			'estimated_minutes' => $lesson['estimated_minutes'],
			'required'          => $lesson['required'],
			'prerequisites'     => $lesson['prerequisites'],
			'objectives'        => $lesson['objectives'],
			'content_version'   => $lesson['content_version'],
			'author'            => 'Muhibbullah Ansary',
		);
	}
}
