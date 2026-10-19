<?php
/**
 * Optional AI tutor — disabled until credentials configured.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Tutor {

	public static function register(): void {
		add_action(
			'rest_api_init',
			static function (): void {
				register_rest_route(
					REST_API::NS,
					'/tutor/ask',
					array(
						'methods'             => 'POST',
						'callback'            => array( self::class, 'ask' ),
						'permission_callback' => array( REST_API::class, 'require_login' ),
					)
				);
			}
		);
	}

	public static function is_enabled(): bool {
		$settings = get_option( 'wgba_settings', array() );
		return ! empty( $settings['tutor_enabled'] ) && ! empty( $settings['tutor_api_key'] );
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function ask( \WP_REST_Request $request ) {
		if ( ! self::is_enabled() ) {
			return new \WP_REST_Response(
				array(
					'status'  => 'disabled',
					'message' => 'AI সহায়তা এখন কনফিগার করা নেই। লেখকের উত্তর বা আগে থেকে লেখা সহায়তা ব্যবহার করুন।',
				),
				503
			);
		}
		// Provider adapter intentionally not calling external APIs until keys + quotas are verified.
		return new \WP_REST_Response(
			array(
				'status'  => 'not_ready',
				'message' => 'Tutor adapter প্রস্তুত; লাইভ কল মালিকের অনুমোদনের অপেক্ষায়।',
			),
			503
		);
	}
}
