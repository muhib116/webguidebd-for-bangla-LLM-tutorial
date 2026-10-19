<?php
/**
 * Authenticated REST endpoints (cookie + nonce).
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class REST_API {

	public const NS = 'wgba/v1';

	public static function register(): void {
		add_action( 'rest_api_init', array( self::class, 'routes' ) );
	}

	public static function routes(): void {
		register_rest_route(
			self::NS,
			'/lesson/(?P<stable_id>[a-z0-9\-]+)',
			array(
				'methods'             => 'GET',
				'callback'            => array( self::class, 'get_lesson' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			self::NS,
			'/progress/reading',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'set_reading' ),
				'permission_callback' => array( self::class, 'require_login' ),
			)
		);

		register_rest_route(
			self::NS,
			'/progress/practice',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'set_practice' ),
				'permission_callback' => array( self::class, 'require_login' ),
			)
		);

		register_rest_route(
			self::NS,
			'/notes',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'save_note' ),
				'permission_callback' => array( self::class, 'require_login' ),
			)
		);

		register_rest_route(
			self::NS,
			'/bookmarks',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'toggle_bookmark' ),
				'permission_callback' => array( self::class, 'require_login' ),
			)
		);

		register_rest_route(
			self::NS,
			'/code-draft',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'save_draft' ),
				'permission_callback' => array( self::class, 'require_login' ),
			)
		);

		register_rest_route(
			self::NS,
			'/quiz/submit',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'submit_quiz' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			self::NS,
			'/questions',
			array(
				'methods'             => 'POST',
				'callback'            => array( self::class, 'submit_question' ),
				'permission_callback' => array( self::class, 'require_login' ),
			)
		);

		register_rest_route(
			self::NS,
			'/me/export',
			array(
				'methods'             => 'GET',
				'callback'            => array( self::class, 'export_me' ),
				'permission_callback' => array( self::class, 'require_login' ),
			)
		);
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return true|\WP_Error
	 */
	public static function require_login( \WP_REST_Request $request ) {
		if ( ! is_user_logged_in() ) {
			return new \WP_Error( 'wgba_auth', 'লগইন প্রয়োজন।', array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function get_lesson( \WP_REST_Request $request ) {
		$stable_id = sanitize_key( (string) $request['stable_id'] );
		$lesson    = Content_Repository::get_lesson_by_stable_id( $stable_id );
		if ( ! $lesson || 'publish' !== $lesson['status'] ) {
			return new \WP_REST_Response( array( 'error' => 'not_found' ), 404 );
		}
		$public = Content_Repository::public_lesson_fields( $lesson );
		if ( ! Access::can_read_lesson_body( $stable_id ) ) {
			$response = new \WP_REST_Response(
				array(
					'access'  => 'overview_only',
					'lesson'  => $public,
					'message' => Access::message_login_for_chapters(),
				),
				200
			);
			$response->header( 'Cache-Control', 'public, max-age=60' );
			return $response;
		}
		$payload = $lesson['payload'];
		// Strip staff-only keys if any.
		unset( $payload['internal_notes'] );
		$body = array(
			'access'  => 'full',
			'lesson'  => array_merge(
				$public,
				array(
					'body_html' => $lesson['body'],
					'payload'   => $payload,
				)
			),
		);
		if ( is_user_logged_in() ) {
			Progress::touch_visit( get_current_user_id(), $stable_id, (string) $lesson['content_version'] );
			$response = new \WP_REST_Response( $body, 200 );
			$response->header( 'Cache-Control', 'private, no-store' );
			return $response;
		}
		$response = new \WP_REST_Response( $body, 200 );
		$response->header( 'Cache-Control', 'public, max-age=60' );
		return $response;
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function set_reading( \WP_REST_Request $request ) {
		$lesson_id = sanitize_key( (string) $request->get_param( 'lesson_stable_id' ) );
		$complete  = (bool) $request->get_param( 'complete' );
		if ( ! Access::can_read_lesson_body( $lesson_id ) ) {
			return new \WP_Error( 'wgba_forbidden', 'অনুমতি নেই।', array( 'status' => 403 ) );
		}
		$lesson = Content_Repository::get_lesson_by_stable_id( $lesson_id );
		$row    = Progress::set_reading_complete(
			get_current_user_id(),
			$lesson_id,
			$complete,
			(string) ( $lesson['content_version'] ?? '1' )
		);
		return new \WP_REST_Response( array( 'progress' => $row ), 200 );
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function set_practice( \WP_REST_Request $request ) {
		$lesson_id = sanitize_key( (string) $request->get_param( 'lesson_stable_id' ) );
		if ( ! Access::can_read_lesson_body( $lesson_id ) ) {
			return new \WP_Error( 'wgba_forbidden', 'অনুমতি নেই।', array( 'status' => 403 ) );
		}
		$lesson = Content_Repository::get_lesson_by_stable_id( $lesson_id );
		$row    = Progress::mark_practice(
			get_current_user_id(),
			$lesson_id,
			(string) ( $lesson['content_version'] ?? '1' )
		);
		return new \WP_REST_Response( array( 'progress' => $row ), 200 );
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save_note( \WP_REST_Request $request ) {
		global $wpdb;
		$user_id   = get_current_user_id();
		$lesson_id = sanitize_key( (string) $request->get_param( 'lesson_stable_id' ) );
		$body      = sanitize_textarea_field( (string) $request->get_param( 'body' ) );
		$client_v  = absint( $request->get_param( 'record_version' ) );
		if ( strlen( $body ) > 20000 ) {
			return new \WP_Error( 'wgba_too_long', 'নোট খুব বড়।', array( 'status' => 400 ) );
		}
		$table = $wpdb->prefix . 'wgba_notes';
		$now   = current_time( 'mysql', true );
		$existing = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE user_id = %d AND lesson_stable_id = %s",
				$user_id,
				$lesson_id
			),
			ARRAY_A
		);
		if ( $existing && $client_v && (int) $existing['record_version'] !== $client_v ) {
			return new \WP_REST_Response(
				array(
					'status'          => 'conflict',
					'server_version'  => (int) $existing['record_version'],
					'server_body'     => $existing['body'],
				),
				409
			);
		}
		$new_v = $existing ? ( (int) $existing['record_version'] + 1 ) : 1;
		if ( $existing ) {
			$wpdb->update(
				$table,
				array(
					'body'           => $body,
					'record_version' => $new_v,
					'updated_at'     => $now,
				),
				array(
					'user_id'          => $user_id,
					'lesson_stable_id' => $lesson_id,
				),
				array( '%s', '%d', '%s' ),
				array( '%d', '%s' )
			);
		} else {
			$wpdb->insert(
				$table,
				array(
					'user_id'          => $user_id,
					'lesson_stable_id' => $lesson_id,
					'body'             => $body,
					'record_version'   => 1,
					'updated_at'       => $now,
				),
				array( '%d', '%s', '%s', '%d', '%s' )
			);
		}
		return new \WP_REST_Response(
			array(
				'status'         => 'saved',
				'record_version' => $new_v,
			),
			200
		);
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function toggle_bookmark( \WP_REST_Request $request ) {
		global $wpdb;
		$user_id = get_current_user_id();
		$type    = sanitize_key( (string) $request->get_param( 'target_type' ) );
		$tid     = sanitize_key( (string) $request->get_param( 'target_stable_id' ) );
		$table   = $wpdb->prefix . 'wgba_bookmarks';
		$exists  = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT id FROM {$table} WHERE user_id = %d AND target_type = %s AND target_stable_id = %s",
				$user_id,
				$type,
				$tid
			)
		);
		if ( $exists ) {
			$wpdb->delete( $table, array( 'id' => (int) $exists ), array( '%d' ) );
			return new \WP_REST_Response( array( 'bookmarked' => false ), 200 );
		}
		$wpdb->insert(
			$table,
			array(
				'user_id'          => $user_id,
				'target_type'      => $type,
				'target_stable_id' => $tid,
				'created_at'       => current_time( 'mysql', true ),
			),
			array( '%d', '%s', '%s', '%s' )
		);
		return new \WP_REST_Response( array( 'bookmarked' => true ), 200 );
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function save_draft( \WP_REST_Request $request ) {
		global $wpdb;
		$user_id = get_current_user_id();
		$ex_id   = sanitize_key( (string) $request->get_param( 'exercise_stable_id' ) );
		$ver     = sanitize_text_field( (string) $request->get_param( 'exercise_version' ) ) ?: '1';
		$code    = (string) $request->get_param( 'source_code' );
		$client_v = absint( $request->get_param( 'record_version' ) );
		if ( strlen( $code ) > 100000 ) {
			return new \WP_Error( 'wgba_too_long', 'কোড খুব বড়।', array( 'status' => 400 ) );
		}
		// Store as text; never execute on server.
		$code  = wp_check_invalid_utf8( $code );
		$table = $wpdb->prefix . 'wgba_code_drafts';
		$now   = current_time( 'mysql', true );
		$existing = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE user_id = %d AND exercise_stable_id = %s AND exercise_version = %s",
				$user_id,
				$ex_id,
				$ver
			),
			ARRAY_A
		);
		if ( $existing && $client_v && (int) $existing['record_version'] !== $client_v ) {
			return new \WP_REST_Response(
				array(
					'status'         => 'conflict',
					'server_version' => (int) $existing['record_version'],
					'server_code'    => $existing['source_code'],
				),
				409
			);
		}
		$new_v = $existing ? ( (int) $existing['record_version'] + 1 ) : 1;
		if ( $existing ) {
			$wpdb->update(
				$table,
				array(
					'source_code'    => $code,
					'record_version' => $new_v,
					'updated_at'     => $now,
				),
				array( 'id' => (int) $existing['id'] ),
				array( '%s', '%d', '%s' ),
				array( '%d' )
			);
		} else {
			$wpdb->insert(
				$table,
				array(
					'user_id'            => $user_id,
					'exercise_stable_id' => $ex_id,
					'exercise_version'   => $ver,
					'source_code'        => $code,
					'record_version'     => 1,
					'updated_at'         => $now,
				),
				array( '%d', '%s', '%s', '%s', '%d', '%s' )
			);
		}
		return new \WP_REST_Response( array( 'status' => 'saved', 'record_version' => $new_v ), 200 );
	}

	/**
	 * Server-side quiz grading — ignores client score.
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function submit_quiz( \WP_REST_Request $request ) {
		$quiz_id = sanitize_key( (string) $request->get_param( 'quiz_stable_id' ) );
		$answers = $request->get_param( 'answers' );
		if ( ! is_array( $answers ) ) {
			return new \WP_Error( 'wgba_bad', 'উত্তর অবৈধ।', array( 'status' => 400 ) );
		}
		$quiz = Quiz_Engine::get_quiz( $quiz_id );
		if ( ! $quiz ) {
			return new \WP_Error( 'wgba_not_found', 'কুইজ পাওয়া যায়নি।', array( 'status' => 404 ) );
		}
		$lesson_id = (string) ( $quiz['lesson_stable_id'] ?? '' );
		if ( $lesson_id && ! Access::can_read_lesson_body( $lesson_id ) ) {
			return new \WP_Error( 'wgba_forbidden', 'অনুমতি নেই।', array( 'status' => 403 ) );
		}
		if ( count( $answers ) > 50 ) {
			return new \WP_Error( 'wgba_bad', 'উত্তর অবৈধ।', array( 'status' => 400 ) );
		}
		$result = Quiz_Engine::grade( $quiz, $answers );
		if ( ! is_user_logged_in() ) {
			return new \WP_REST_Response(
				array(
					'earned'   => $result['earned'],
					'possible' => $result['possible'],
					'passed'   => $result['passed'],
					'feedback' => $result['feedback'],
					'saved'    => false,
					'note'     => Access::message_login_for_progress(),
				),
				200
			);
		}
		global $wpdb;
		$wpdb->insert(
			$wpdb->prefix . 'wgba_quiz_attempts',
			array(
				'user_id'             => get_current_user_id(),
				'quiz_stable_id'      => $quiz_id,
				'assessment_version'  => (string) ( $quiz['version'] ?? '1' ),
				'answers_json'        => wp_json_encode( $answers ),
				'score_earned'        => $result['earned'],
				'score_possible'      => $result['possible'],
				'passed'              => $result['passed'] ? 1 : 0,
				'created_at'          => current_time( 'mysql', true ),
			),
			array( '%d', '%s', '%s', '%s', '%f', '%f', '%d', '%s' )
		);
		if ( $result['passed'] && $lesson_id ) {
			$lesson = Content_Repository::get_lesson_by_stable_id( $lesson_id );
			Progress::touch_visit( get_current_user_id(), $lesson_id, (string) ( $lesson['content_version'] ?? '1' ) );
			global $wpdb;
			$wpdb->update(
				$wpdb->prefix . 'wgba_progress',
				array(
					'assessed_complete'     => 1,
					'assessed_completed_at' => current_time( 'mysql', true ),
					'updated_at'            => current_time( 'mysql', true ),
				),
				array(
					'user_id'          => get_current_user_id(),
					'lesson_stable_id' => $lesson_id,
				),
				array( '%d', '%s', '%s' ),
				array( '%d', '%s' )
			);
		}
		return new \WP_REST_Response(
			array(
				'earned'      => $result['earned'],
				'possible'    => $result['possible'],
				'passed'      => $result['passed'],
				'feedback'    => $result['feedback'],
				'note'        => 'স্কোর সার্ভারে যাচাই করা হয়েছে; ক্লায়েন্ট-প্রেরিত স্কোর গ্রহণ করা হয়নি।',
			),
			200
		);
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function submit_question( \WP_REST_Request $request ) {
		global $wpdb;
		$body = sanitize_textarea_field( (string) $request->get_param( 'question_body' ) );
		if ( strlen( $body ) < 10 || strlen( $body ) > 4000 ) {
			return new \WP_Error( 'wgba_bad', 'প্রশ্নের দৈর্ঘ্য সীমার বাইরে।', array( 'status' => 400 ) );
		}
		$lesson_id = sanitize_key( (string) $request->get_param( 'lesson_stable_id' ) );
		$wpdb->insert(
			$wpdb->prefix . 'wgba_questions',
			array(
				'user_id'          => get_current_user_id(),
				'lesson_stable_id' => $lesson_id,
				'selected_text'    => sanitize_textarea_field( (string) $request->get_param( 'selected_text' ) ),
				'code_snippet'     => substr( (string) $request->get_param( 'code_snippet' ), 0, 20000 ),
				'error_text'       => sanitize_textarea_field( (string) $request->get_param( 'error_text' ) ),
				'question_body'    => $body,
				'status'           => 'open',
				'created_at'       => current_time( 'mysql', true ),
				'updated_at'       => current_time( 'mysql', true ),
			),
			array( '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
		);
		return new \WP_REST_Response(
			array(
				'status'  => 'saved',
				'message' => 'আপনার প্রশ্ন সংরক্ষিত হয়েছে (ব্যক্তিগত থ্রেড)।',
				'id'      => (int) $wpdb->insert_id,
			),
			201
		);
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function export_me( \WP_REST_Request $request ) {
		$user_id = get_current_user_id();
		global $wpdb;
		$p = $wpdb->prefix . 'wgba_';
		$data = array(
			'schema_version' => '1.0.0',
			'exported_at'    => gmdate( 'c' ),
			'user_id'        => $user_id,
			'progress'       => $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$p}progress WHERE user_id = %d", $user_id ), ARRAY_A ),
			'notes'          => $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$p}notes WHERE user_id = %d", $user_id ), ARRAY_A ),
			'bookmarks'      => $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$p}bookmarks WHERE user_id = %d", $user_id ), ARRAY_A ),
			'code_drafts'    => $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$p}code_drafts WHERE user_id = %d", $user_id ), ARRAY_A ),
			'questions'      => $wpdb->get_results( $wpdb->prepare( "SELECT id, lesson_stable_id, question_body, status, staff_reply, created_at FROM {$p}questions WHERE user_id = %d", $user_id ), ARRAY_A ),
			'quiz_attempts'  => $wpdb->get_results( $wpdb->prepare( "SELECT id, quiz_stable_id, assessment_version, score_earned, score_possible, passed, created_at, answers_json FROM {$p}quiz_attempts WHERE user_id = %d", $user_id ), ARRAY_A ),
			'provenance'     => 'personal_learning_backup',
		);
		$response = new \WP_REST_Response( $data, 200 );
		$response->header( 'Cache-Control', 'private, no-store' );
		return $response;
	}
}
