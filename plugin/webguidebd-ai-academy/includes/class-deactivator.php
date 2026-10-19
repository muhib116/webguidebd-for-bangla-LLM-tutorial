<?php
/**
 * Deactivation preserves course and learner data.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Deactivator {

	/**
	 * Flush rewrites only; do not drop tables or delete posts.
	 */
	public static function deactivate(): void {
		flush_rewrite_rules();
	}
}
