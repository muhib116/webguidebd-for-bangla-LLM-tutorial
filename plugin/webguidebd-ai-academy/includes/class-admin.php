<?php
/**
 * WordPress admin screens.
 *
 * @package WebGuideBD\AIAcademy
 */

declare(strict_types=1);

namespace WGBA;

defined( 'ABSPATH' ) || exit;

final class Admin {

	public static function register(): void {
		add_action( 'admin_menu', array( self::class, 'menu' ) );
		add_action( 'add_meta_boxes', array( self::class, 'meta_boxes' ) );
		add_action( 'save_post_wgba_lesson', array( self::class, 'save_lesson_meta' ), 10, 2 );
		add_action( 'save_post_wgba_chapter', array( self::class, 'save_chapter_meta' ), 10, 2 );
		add_action( 'admin_init', array( self::class, 'handle_settings_save' ) );
	}

	public static function menu(): void {
		add_menu_page(
			'AI Academy',
			'AI Academy',
			Capabilities::MANAGE_CURRICULUM,
			'wgba-academy',
			array( self::class, 'render_dashboard' ),
			'dashicons-welcome-learn-more',
			26
		);
		add_submenu_page(
			'wgba-academy',
			'সেটিংস',
			'সেটিংস',
			Capabilities::MANAGE_SETTINGS,
			'wgba-settings',
			array( self::class, 'render_settings' )
		);
		add_submenu_page(
			'wgba-academy',
			'প্রশ্ন',
			'প্রশ্ন',
			Capabilities::ANSWER_QUESTIONS,
			'wgba-questions',
			array( self::class, 'render_questions' )
		);
		add_submenu_page(
			'wgba-academy',
			'ইমপোর্ট/এক্সপোর্ট',
			'ইমপোর্ট/এক্সপোর্ট',
			Capabilities::IMPORT_CONTENT,
			'wgba-import-export',
			array( self::class, 'render_import_export' )
		);
	}

	public static function render_dashboard(): void {
		if ( ! Capabilities::can_manage_curriculum() ) {
			wp_die( esc_html__( 'অনুমতি নেই।', 'webguidebd-ai-academy' ) );
		}
		$chapters = Content_Repository::list_chapters( false );
		echo '<div class="wrap"><h1>WebGuideBD AI Academy</h1>';
		echo '<p>লেখক: <strong>Muhibbullah Ansary</strong> · স্কিমা ' . esc_html( WGBA_CONTENT_SCHEMA ) . ' · প্লাগইন ' . esc_html( WGBA_VERSION ) . '</p>';
		echo '<h2>অধ্যায়</h2><table class="widefat"><thead><tr><th>Stable ID</th><th>শিরোনাম</th><th>পাবলিক প্রিভিউ</th><th>স্ট্যাটাস</th></tr></thead><tbody>';
		$preview = Access::public_preview_chapter_ids();
		foreach ( $chapters as $ch ) {
			$sid = (string) $ch['stable_id'];
			echo '<tr><td><code>' . esc_html( $sid ) . '</code></td><td>' . esc_html( (string) $ch['title'] ) . '</td><td>' .
				( in_array( $sid, $preview, true ) ? 'হ্যাঁ' : 'না' ) . '</td><td>' . esc_html( (string) $ch['status'] ) . '</td></tr>';
		}
		echo '</tbody></table>';
		echo '<p><em>পাবলিক প্রিভিউ stable chapter ID দিয়ে নির্ধারিত — ডিসপ্লে অর্ডার বদলালে অ্যাক্সেস বদলায় না। পরিবর্তনে সেটিংস থেকে ইচ্ছাকৃত সেভ প্রয়োজন।</em></p>';
		if ( ! empty( $_GET['wgba_seeded'] ) ) {
			echo '<div class="notice notice-success"><p>পাঠ্যক্রম সিড সম্পন্ন।</p></div>';
		}
		$seed_url = wp_nonce_url( admin_url( 'admin.php?page=wgba-academy&wgba_seed=1' ), 'wgba_seed' );
		echo '<p><a class="button button-primary" href="' . esc_url( $seed_url ) . '">পাঠ্যক্রম (১৪ অধ্যায়) ইনস্টল / রি-সিড</a></p>';
		echo '</div>';
	}

	public static function render_settings(): void {
		if ( ! current_user_can( Capabilities::MANAGE_SETTINGS ) ) {
			wp_die( esc_html__( 'অনুমতি নেই।', 'webguidebd-ai-academy' ) );
		}
		$settings = get_option( 'wgba_settings', array() );
		$preview  = Access::public_preview_chapter_ids();
		include WGBA_PLUGIN_DIR . 'admin/views/settings.php';
	}

	public static function handle_settings_save(): void {
		if ( empty( $_POST['wgba_settings_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( (string) $_POST['wgba_settings_nonce'] ) ), 'wgba_settings' ) ) {
			return;
		}
		if ( ! current_user_can( Capabilities::MANAGE_SETTINGS ) ) {
			return;
		}
		$old_preview = Access::public_preview_chapter_ids();
		$new_preview = isset( $_POST['public_preview'] ) && is_array( $_POST['public_preview'] )
			? array_map( 'sanitize_key', wp_unslash( $_POST['public_preview'] ) )
			: array();
		if ( $old_preview !== $new_preview ) {
			// Require intentional confirmation checkbox.
			if ( empty( $_POST['confirm_preview_change'] ) ) {
				add_settings_error( 'wgba', 'preview', 'প্রিভিউ সেট পরিবর্তনের জন্য নিশ্চিতকরণ টিক দিন। প্রভাবিত অধ্যায়: ' . implode( ', ', array_unique( array_merge( $old_preview, $new_preview ) ) ), 'error' );
				return;
			}
			update_option( 'wgba_public_preview_chapters', array_values( $new_preview ), false );
			wp_cache_flush();
		}

		$settings = get_option( 'wgba_settings', array() );
		$settings['author_display_name']   = sanitize_text_field( wp_unslash( (string) ( $_POST['author_display_name'] ?? 'Muhibbullah Ansary' ) ) );
		$settings['author_email']          = sanitize_email( wp_unslash( (string) ( $_POST['author_email'] ?? '' ) ) );
		$settings['author_phone']          = sanitize_text_field( wp_unslash( (string) ( $_POST['author_phone'] ?? '' ) ) );
		$settings['author_role']           = sanitize_text_field( wp_unslash( (string) ( $_POST['author_role'] ?? '' ) ) );
		$settings['author_bio']            = wp_kses_post( wp_unslash( (string) ( $_POST['author_bio'] ?? '' ) ) );
		$settings['author_expertise_text'] = sanitize_textarea_field( wp_unslash( (string) ( $_POST['author_expertise_text'] ?? '' ) ) );
		$settings['author_photo_id']       = absint( $_POST['author_photo_id'] ?? 0 );
		$settings['author_linkedin']       = esc_url_raw( wp_unslash( (string) ( $_POST['author_linkedin'] ?? '' ) ) );
		$settings['author_facebook']       = esc_url_raw( wp_unslash( (string) ( $_POST['author_facebook'] ?? '' ) ) );
		$settings['author_instagram']      = esc_url_raw( wp_unslash( (string) ( $_POST['author_instagram'] ?? '' ) ) );
		$settings['author_youtube']        = esc_url_raw( wp_unslash( (string) ( $_POST['author_youtube'] ?? '' ) ) );
		$settings['serve_as_front_page'] = ! empty( $_POST['serve_as_front_page'] );
		$settings['ads_enabled']         = ! empty( $_POST['ads_enabled'] );
		$settings['ads_publisher_id']    = sanitize_text_field( wp_unslash( (string) ( $_POST['ads_publisher_id'] ?? '' ) ) );
		$settings['tutor_enabled']       = ! empty( $_POST['tutor_enabled'] );
		// API key stored only if provided; never echoed back in full.
		if ( ! empty( $_POST['tutor_api_key'] ) ) {
			$settings['tutor_api_key'] = sanitize_text_field( wp_unslash( (string) $_POST['tutor_api_key'] ) );
		}
		$settings['analytics_enabled'] = false; // Force disabled until real config.
		update_option( 'wgba_settings', $settings, false );
		add_settings_error( 'wgba', 'saved', 'সেটিংস সংরক্ষিত।', 'updated' );
	}

	public static function render_questions(): void {
		if ( ! current_user_can( Capabilities::ANSWER_QUESTIONS ) ) {
			wp_die( esc_html__( 'অনুমতি নেই।', 'webguidebd-ai-academy' ) );
		}
		global $wpdb;
		$table = $wpdb->prefix . 'wgba_questions';
		if ( ! empty( $_POST['wgba_reply_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( (string) $_POST['wgba_reply_nonce'] ) ), 'wgba_reply' ) ) {
			$qid   = absint( $_POST['question_id'] ?? 0 );
			$reply = wp_kses_post( wp_unslash( (string) ( $_POST['staff_reply'] ?? '' ) ) );
			$wpdb->update(
				$table,
				array(
					'staff_reply' => $reply,
					'status'      => 'answered',
					'replied_by'  => get_current_user_id(),
					'replied_at'  => current_time( 'mysql', true ),
					'updated_at'  => current_time( 'mysql', true ),
				),
				array( 'id' => $qid ),
				array( '%s', '%s', '%d', '%s', '%s' ),
				array( '%d' )
			);
		}
		$rows = $wpdb->get_results( "SELECT * FROM {$table} ORDER BY created_at DESC LIMIT 100", ARRAY_A );
		include WGBA_PLUGIN_DIR . 'admin/views/questions.php';
	}

	public static function render_import_export(): void {
		if ( ! current_user_can( Capabilities::IMPORT_CONTENT ) ) {
			wp_die( esc_html__( 'অনুমতি নেই।', 'webguidebd-ai-academy' ) );
		}
		include WGBA_PLUGIN_DIR . 'admin/views/import-export.php';
	}

	public static function meta_boxes(): void {
		add_meta_box( 'wgba_lesson_meta', 'AI Academy পাঠ মেটা', array( self::class, 'render_lesson_metabox' ), 'wgba_lesson', 'normal', 'high' );
		add_meta_box( 'wgba_chapter_meta', 'AI Academy অধ্যায় মেটা', array( self::class, 'render_chapter_metabox' ), 'wgba_chapter', 'side', 'default' );
	}

	/**
	 * @param \WP_Post $post Post.
	 */
	public static function render_lesson_metabox( \WP_Post $post ): void {
		wp_nonce_field( 'wgba_lesson_meta', 'wgba_lesson_meta_nonce' );
		$stable = (string) get_post_meta( $post->ID, '_wgba_stable_id', true );
		$chapter = (string) get_post_meta( $post->ID, '_wgba_chapter_stable_id', true );
		$summary = (string) get_post_meta( $post->ID, '_wgba_summary', true );
		$overview = (string) get_post_meta( $post->ID, '_wgba_public_overview', true );
		$minutes = (int) get_post_meta( $post->ID, '_wgba_estimated_minutes', true );
		$required = (bool) get_post_meta( $post->ID, '_wgba_required', true );
		$prereq = (array) get_post_meta( $post->ID, '_wgba_prerequisites', true );
		$payload = (string) get_post_meta( $post->ID, '_wgba_payload_json', true );
		echo '<p><label>Stable ID<br><input class="widefat" name="wgba_stable_id" value="' . esc_attr( $stable ) . '"></label></p>';
		echo '<p><label>Chapter Stable ID<br><input class="widefat" name="wgba_chapter_stable_id" value="' . esc_attr( $chapter ) . '"></label></p>';
		echo '<p><label>সারাংশ<br><textarea class="widefat" name="wgba_summary" rows="3">' . esc_textarea( $summary ) . '</textarea></label></p>';
		echo '<p><label>পাবলিক ওভারভিউ (লগইন-সুরক্ষিত পাঠের জন্য)<br><textarea class="widefat" name="wgba_public_overview" rows="5">' . esc_textarea( $overview ) . '</textarea></label></p>';
		echo '<p><label>সময় (মিনিট) <input type="number" name="wgba_estimated_minutes" value="' . esc_attr( (string) $minutes ) . '"></label> ';
		echo '<label><input type="checkbox" name="wgba_required" value="1" ' . checked( $required, true, false ) . '> আবশ্যক</label></p>';
		echo '<p><label>Prerequisite IDs (কমা)<br><input class="widefat" name="wgba_prerequisites" value="' . esc_attr( implode( ',', $prereq ) ) . '"></label></p>';
		echo '<p><label>Payload JSON (exercises/quiz)<br><textarea class="widefat code" name="wgba_payload_json" rows="10">' . esc_textarea( $payload ) . '</textarea></label></p>';
	}

	/**
	 * @param \WP_Post $post Post.
	 */
	public static function render_chapter_metabox( \WP_Post $post ): void {
		wp_nonce_field( 'wgba_chapter_meta', 'wgba_chapter_meta_nonce' );
		$stable = (string) get_post_meta( $post->ID, '_wgba_stable_id', true );
		$summary = (string) get_post_meta( $post->ID, '_wgba_summary', true );
		echo '<p><label>Stable ID<br><input class="widefat" name="wgba_stable_id" value="' . esc_attr( $stable ) . '"></label></p>';
		echo '<p><label>সারাংশ<br><textarea class="widefat" name="wgba_summary" rows="4">' . esc_textarea( $summary ) . '</textarea></label></p>';
	}

	/**
	 * @param int      $post_id ID.
	 * @param \WP_Post $post    Post.
	 */
	public static function save_lesson_meta( int $post_id, \WP_Post $post ): void {
		if ( ! isset( $_POST['wgba_lesson_meta_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( (string) $_POST['wgba_lesson_meta_nonce'] ) ), 'wgba_lesson_meta' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$stable = sanitize_key( wp_unslash( (string) ( $_POST['wgba_stable_id'] ?? '' ) ) );
		if ( $stable ) {
			update_post_meta( $post_id, '_wgba_stable_id', $stable );
		}
		update_post_meta( $post_id, '_wgba_chapter_stable_id', sanitize_key( wp_unslash( (string) ( $_POST['wgba_chapter_stable_id'] ?? '' ) ) ) );
		update_post_meta( $post_id, '_wgba_summary', sanitize_textarea_field( wp_unslash( (string) ( $_POST['wgba_summary'] ?? '' ) ) ) );
		update_post_meta( $post_id, '_wgba_public_overview', wp_kses_post( wp_unslash( (string) ( $_POST['wgba_public_overview'] ?? '' ) ) ) );
		update_post_meta( $post_id, '_wgba_estimated_minutes', absint( $_POST['wgba_estimated_minutes'] ?? 0 ) );
		update_post_meta( $post_id, '_wgba_required', ! empty( $_POST['wgba_required'] ) ? 1 : 0 );
		$prereq = array_filter( array_map( 'sanitize_key', explode( ',', (string) ( $_POST['wgba_prerequisites'] ?? '' ) ) ) );
		update_post_meta( $post_id, '_wgba_prerequisites', $prereq );
		$json = wp_unslash( (string) ( $_POST['wgba_payload_json'] ?? '' ) );
		if ( $json && null === json_decode( $json, true ) ) {
			// Keep previous if invalid.
		} else {
			update_post_meta( $post_id, '_wgba_payload_json', wp_slash( $json ) );
		}
		if ( ! get_post_meta( $post_id, '_wgba_content_version', true ) ) {
			update_post_meta( $post_id, '_wgba_content_version', '1' );
		}
	}

	/**
	 * @param int      $post_id ID.
	 * @param \WP_Post $post    Post.
	 */
	public static function save_chapter_meta( int $post_id, \WP_Post $post ): void {
		if ( ! isset( $_POST['wgba_chapter_meta_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( (string) $_POST['wgba_chapter_meta_nonce'] ) ), 'wgba_chapter_meta' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		update_post_meta( $post_id, '_wgba_stable_id', sanitize_key( wp_unslash( (string) ( $_POST['wgba_stable_id'] ?? '' ) ) ) );
		update_post_meta( $post_id, '_wgba_summary', sanitize_textarea_field( wp_unslash( (string) ( $_POST['wgba_summary'] ?? '' ) ) ) );
	}
}
