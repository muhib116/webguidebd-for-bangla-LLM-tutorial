<?php
/**
 * Custom learner tables + upgrades.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Schema {

	/**
	 * Create or upgrade tables.
	 */
	public static function install(): void {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset = $wpdb->get_charset_collate();
		$p       = $wpdb->prefix . 'wgba_';

		$sql = array();

		$sql[] = "CREATE TABLE {$p}progress (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id BIGINT UNSIGNED NOT NULL,
			lesson_stable_id VARCHAR(64) NOT NULL,
			content_version VARCHAR(32) NOT NULL DEFAULT '1',
			started_at DATETIME NULL,
			last_visited_at DATETIME NULL,
			reading_complete TINYINT(1) NOT NULL DEFAULT 0,
			reading_completed_at DATETIME NULL,
			practice_complete TINYINT(1) NOT NULL DEFAULT 0,
			practice_completed_at DATETIME NULL,
			assessed_complete TINYINT(1) NOT NULL DEFAULT 0,
			assessed_completed_at DATETIME NULL,
			review_recommended TINYINT(1) NOT NULL DEFAULT 0,
			updated_at DATETIME NOT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY user_lesson (user_id, lesson_stable_id),
			KEY lesson_idx (lesson_stable_id),
			KEY user_idx (user_id)
		) $charset;";

		$sql[] = "CREATE TABLE {$p}notes (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id BIGINT UNSIGNED NOT NULL,
			lesson_stable_id VARCHAR(64) NOT NULL,
			body LONGTEXT NOT NULL,
			record_version INT UNSIGNED NOT NULL DEFAULT 1,
			updated_at DATETIME NOT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY user_lesson_note (user_id, lesson_stable_id),
			KEY user_idx (user_id)
		) $charset;";

		$sql[] = "CREATE TABLE {$p}bookmarks (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id BIGINT UNSIGNED NOT NULL,
			target_type VARCHAR(32) NOT NULL,
			target_stable_id VARCHAR(64) NOT NULL,
			created_at DATETIME NOT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY user_target (user_id, target_type, target_stable_id),
			KEY user_idx (user_id)
		) $charset;";

		$sql[] = "CREATE TABLE {$p}code_drafts (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id BIGINT UNSIGNED NOT NULL,
			exercise_stable_id VARCHAR(64) NOT NULL,
			exercise_version VARCHAR(32) NOT NULL DEFAULT '1',
			source_code LONGTEXT NOT NULL,
			record_version INT UNSIGNED NOT NULL DEFAULT 1,
			updated_at DATETIME NOT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY user_exercise (user_id, exercise_stable_id, exercise_version),
			KEY user_idx (user_id)
		) $charset;";

		$sql[] = "CREATE TABLE {$p}questions (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id BIGINT UNSIGNED NOT NULL,
			lesson_stable_id VARCHAR(64) NOT NULL,
			selected_text TEXT NULL,
			code_snippet LONGTEXT NULL,
			error_text TEXT NULL,
			question_body TEXT NOT NULL,
			status VARCHAR(20) NOT NULL DEFAULT 'open',
			staff_reply LONGTEXT NULL,
			replied_by BIGINT UNSIGNED NULL,
			replied_at DATETIME NULL,
			consent_public TINYINT(1) NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			PRIMARY KEY  (id),
			KEY user_idx (user_id),
			KEY lesson_idx (lesson_stable_id),
			KEY status_idx (status)
		) $charset;";

		$sql[] = "CREATE TABLE {$p}quiz_attempts (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id BIGINT UNSIGNED NOT NULL,
			quiz_stable_id VARCHAR(64) NOT NULL,
			assessment_version VARCHAR(32) NOT NULL DEFAULT '1',
			answers_json LONGTEXT NOT NULL,
			score_earned DECIMAL(8,2) NOT NULL DEFAULT 0,
			score_possible DECIMAL(8,2) NOT NULL DEFAULT 0,
			passed TINYINT(1) NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL,
			PRIMARY KEY  (id),
			KEY user_quiz (user_id, quiz_stable_id),
			KEY quiz_idx (quiz_stable_id)
		) $charset;";

		foreach ( $sql as $statement ) {
			dbDelta( $statement );
		}

		update_option( 'wgba_db_version', WGBA_DB_VERSION, false );
	}

	/**
	 * Maybe upgrade when version changes.
	 */
	public static function maybe_upgrade(): void {
		$current = (string) get_option( 'wgba_db_version', '' );
		if ( $current !== WGBA_DB_VERSION ) {
			self::install();
		}
	}
}
