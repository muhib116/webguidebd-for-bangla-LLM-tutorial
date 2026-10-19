<?php
/**
 * Durable per-user progress.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Progress {

	/**
	 * @return array<string,mixed>|null
	 */
	public static function get( int $user_id, string $lesson_stable_id ): ?array {
		global $wpdb;
		$table = $wpdb->prefix . 'wgba_progress';
		$row   = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE user_id = %d AND lesson_stable_id = %s",
				$user_id,
				$lesson_stable_id
			),
			ARRAY_A
		);
		return $row ?: null;
	}

	/**
	 * Touch last visited / started.
	 */
	public static function touch_visit( int $user_id, string $lesson_stable_id, string $content_version ): void {
		global $wpdb;
		$table = $wpdb->prefix . 'wgba_progress';
		$now   = current_time( 'mysql', true );
		$existing = self::get( $user_id, $lesson_stable_id );
		if ( $existing ) {
			$wpdb->update(
				$table,
				array(
					'last_visited_at' => $now,
					'content_version' => $content_version,
					'updated_at'      => $now,
					'started_at'      => $existing['started_at'] ?: $now,
				),
				array(
					'user_id'          => $user_id,
					'lesson_stable_id' => $lesson_stable_id,
				),
				array( '%s', '%s', '%s', '%s' ),
				array( '%d', '%s' )
			);
			return;
		}
		$wpdb->insert(
			$table,
			array(
				'user_id'          => $user_id,
				'lesson_stable_id' => $lesson_stable_id,
				'content_version'  => $content_version,
				'started_at'       => $now,
				'last_visited_at'  => $now,
				'updated_at'       => $now,
			),
			array( '%d', '%s', '%s', '%s', '%s', '%s' )
		);
		update_user_meta( $user_id, 'wgba_last_lesson', $lesson_stable_id );
	}

	/**
	 * Explicit reading completion toggle.
	 */
	public static function set_reading_complete( int $user_id, string $lesson_stable_id, bool $complete, string $content_version ): array {
		global $wpdb;
		$table = $wpdb->prefix . 'wgba_progress';
		$now   = current_time( 'mysql', true );
		self::touch_visit( $user_id, $lesson_stable_id, $content_version );
		$wpdb->update(
			$table,
			array(
				'reading_complete'     => $complete ? 1 : 0,
				'reading_completed_at' => $complete ? $now : null,
				'updated_at'           => $now,
			),
			array(
				'user_id'          => $user_id,
				'lesson_stable_id' => $lesson_stable_id,
			),
			array( '%d', '%s', '%s' ),
			array( '%d', '%s' )
		);
		return self::get( $user_id, $lesson_stable_id ) ?? array();
	}

	/**
	 * Practice checkpoint (formative).
	 */
	public static function mark_practice( int $user_id, string $lesson_stable_id, string $content_version ): array {
		global $wpdb;
		$table = $wpdb->prefix . 'wgba_progress';
		$now   = current_time( 'mysql', true );
		self::touch_visit( $user_id, $lesson_stable_id, $content_version );
		$wpdb->update(
			$table,
			array(
				'practice_complete'     => 1,
				'practice_completed_at' => $now,
				'updated_at'            => $now,
			),
			array(
				'user_id'          => $user_id,
				'lesson_stable_id' => $lesson_stable_id,
			),
			array( '%d', '%s', '%s' ),
			array( '%d', '%s' )
		);
		return self::get( $user_id, $lesson_stable_id ) ?? array();
	}

	/**
	 * Reading percentage for required published lessons.
	 *
	 * @return array{reading_percent:float,required_total:int,required_complete:int,practice_complete:int}
	 */
	public static function course_reading_stats( int $user_id ): array {
		$required = array();
		foreach ( Content_Repository::list_chapters( true ) as $chapter ) {
			foreach ( Content_Repository::list_lessons_for_chapter( (string) $chapter['stable_id'], true ) as $lesson ) {
				if ( ! empty( $lesson['required'] ) ) {
					$required[] = (string) $lesson['stable_id'];
				}
			}
		}
		$total = count( $required );
		if ( 0 === $total ) {
			return array(
				'reading_percent'    => 0.0,
				'required_total'     => 0,
				'required_complete'  => 0,
				'practice_complete'  => 0,
			);
		}
		global $wpdb;
		$table = $wpdb->prefix . 'wgba_progress';
		$placeholders = implode( ',', array_fill( 0, $total, '%s' ) );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$sql = $wpdb->prepare(
			"SELECT lesson_stable_id, reading_complete, practice_complete FROM {$table}
			WHERE user_id = %d AND lesson_stable_id IN ($placeholders)",
			array_merge( array( $user_id ), $required )
		);
		$rows = $wpdb->get_results( $sql, ARRAY_A );
		$read = 0;
		$prac = 0;
		foreach ( (array) $rows as $row ) {
			if ( ! empty( $row['reading_complete'] ) ) {
				++$read;
			}
			if ( ! empty( $row['practice_complete'] ) ) {
				++$prac;
			}
		}
		return array(
			'reading_percent'   => round( ( $read / $total ) * 100, 1 ),
			'required_total'    => $total,
			'required_complete' => $read,
			'practice_complete' => $prac,
		);
	}
}
