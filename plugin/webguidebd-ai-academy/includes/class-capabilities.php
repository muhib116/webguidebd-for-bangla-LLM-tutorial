<?php
/**
 * Capability model for curriculum staff vs learners.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Capabilities {

	public const MANAGE_CURRICULUM = 'wgba_manage_curriculum';
	public const ANSWER_QUESTIONS  = 'wgba_answer_questions';
	public const VIEW_PROGRESS     = 'wgba_view_progress_summaries';
	public const IMPORT_CONTENT    = 'wgba_import_content';
	public const MANAGE_SETTINGS   = 'wgba_manage_settings';

	/**
	 * Grant caps to administrators only; do not alter other roles.
	 */
	public static function install_roles(): void {
		$admin = get_role( 'administrator' );
		if ( ! $admin ) {
			return;
		}
		foreach ( self::all_caps() as $cap ) {
			$admin->add_cap( $cap );
		}
		// Learners use Subscriber — no new elevated caps on subscriber.
	}

	/**
	 * @return list<string>
	 */
	public static function all_caps(): array {
		return array(
			self::MANAGE_CURRICULUM,
			self::ANSWER_QUESTIONS,
			self::VIEW_PROGRESS,
			self::IMPORT_CONTENT,
			self::MANAGE_SETTINGS,
		);
	}

	public static function can_manage_curriculum( ?int $user_id = null ): bool {
		if ( self::user_can( self::MANAGE_CURRICULUM, $user_id ) ) {
			return true;
		}
		// Fallback: WP admin always manages curriculum even if caps were not re-granted.
		if ( null === $user_id ) {
			return current_user_can( 'manage_options' );
		}
		return user_can( $user_id, 'manage_options' );
	}

	public static function user_can( string $cap, ?int $user_id = null ): bool {
		if ( null === $user_id ) {
			return current_user_can( $cap );
		}
		return user_can( $user_id, $cap );
	}
}
