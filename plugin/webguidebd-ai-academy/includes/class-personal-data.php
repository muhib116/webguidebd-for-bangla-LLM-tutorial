<?php
/**
 * WP personal data exporter / eraser hooks.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Personal_Data {

	public static function register(): void {
		add_filter( 'wp_privacy_personal_data_exporters', array( self::class, 'register_exporter' ) );
		add_filter( 'wp_privacy_personal_data_erasers', array( self::class, 'register_eraser' ) );
	}

	/**
	 * @param mixed $exporters Exporters.
	 * @return array<string,mixed>
	 */
	public static function register_exporter( $exporters ): array {
		if ( ! is_array( $exporters ) ) {
			$exporters = array();
		}
		$exporters['wgba-academy'] = array(
			'exporter'     => 'WebGuideBD AI Academy',
			'callback' => array( self::class, 'export' ),
		);
		return $exporters;
	}

	/**
	 * @param mixed $erasers Erasers.
	 * @return array<string,mixed>
	 */
	public static function register_eraser( $erasers ): array {
		if ( ! is_array( $erasers ) ) {
			$erasers = array();
		}
		$erasers['wgba-academy'] = array(
			'exporter'     => 'WebGuideBD AI Academy',
			'callback' => array( self::class, 'erase' ),
		);
		return $erasers;
	}

	/**
	 * @param string $email Email.
	 * @param int    $page  Page.
	 * @return array<string,mixed>
	 */
	public static function export( string $email, int $page = 1 ): array {
		$user = get_user_by( 'email', $email );
		if ( ! $user ) {
			return array(
				'data' => array(),
				'done' => true,
			);
		}
		global $wpdb;
		$p    = $wpdb->prefix . 'wgba_';
		$uid  = (int) $user->ID;
		$items = array();
		foreach ( array( 'progress', 'notes', 'bookmarks', 'code_drafts', 'questions' ) as $table ) {
			$rows = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$p}{$table} WHERE user_id = %d", $uid ), ARRAY_A );
			foreach ( (array) $rows as $row ) {
				$items[] = array(
					'name'  => $table,
					'value' => wp_json_encode( $row ),
				);
			}
		}
		return array(
			'data' => array(
				array(
					'group_id'    => 'wgba-academy',
					'group_label' => 'AI Academy learner data',
					'item_id'     => 'wgba-user-' . $uid,
					'data'        => $items,
				),
			),
			'done' => true,
		);
	}

	/**
	 * @param string $email Email.
	 * @param int    $page  Page.
	 * @return array<string,mixed>
	 */
	public static function erase( string $email, int $page = 1 ): array {
		$user = get_user_by( 'email', $email );
		if ( ! $user ) {
			return array(
				'items_removed'  => false,
				'items_retained' => false,
				'messages'       => array(),
				'done'           => true,
			);
		}
		global $wpdb;
		$p   = $wpdb->prefix . 'wgba_';
		$uid = (int) $user->ID;
		foreach ( array( 'progress', 'notes', 'bookmarks', 'code_drafts', 'code_drafts', 'questions', 'quiz_attempts' ) as $table ) {
			$wpdb->delete( $p . $table, array( 'user_id' => $uid ), array( '%d' ) );
		}
		return array(
			'items_removed'  => true,
			'items_retained' => false,
			'messages'       => array( 'WebGuideBD AI Academy learner records removed.' ),
			'done'           => true,
		);
	}
}
